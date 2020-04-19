const express = require('express')()
const http = require('http').Server(express)
const io = require('socket.io')(http)

const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
  console.log(`Listening at :${PORT}...`)
})

enum GameState {
  Lobby = 'LOBBY',
  Revolution = 'REVOLUTION',
  Tax = 'TAX',
  Play = 'PLAY'
}

interface User {
  socketID: string
  name: string
  ready: boolean
  left: boolean
  won: number // 0 is not yet, 1 is first place, 2 is second place, etc
  cards: number[] // hopefully i can restrict it to be 1-13 or something
  taxCards: number[]
  taxSubmitted: boolean
}

interface Room {
  name: string
  state: GameState
  trickLead: string // username
  currentPlayer: string // username
  currentCard: number
  currentCardCount: number
  users: User[]
  revolutionTimer: number
  revolutionInterval: NodeJS.Timeout
  firstRound: boolean
}

const REVOLUTION_LENGTH = 5
const CARD_ORDER = (a: number, b: number) => a - b
const JOKER = 99

let rooms: Room[] = []

io.on('connection', socket => {
  

  socket.on('room-created', (roomName: string) => {
    if (rooms.filter(room => roomName === room.name).length === 0) { // dumb
      rooms.push({
        name: roomName,
        trickLead: '',
        currentPlayer: '',
        currentCard: 0,
        currentCardCount: 0,
        state: GameState.Lobby,
        users: [],
        revolutionTimer: REVOLUTION_LENGTH + 1,
        revolutionInterval: null,
        firstRound: true
      })
      // emit update
    }
  })

  socket.on('room-removed', (roomName: string) => {
    let sizeBefore = rooms.length
    rooms = rooms.filter(room => room.name !== roomName)
    if (sizeBefore !== rooms.length) {
      // emit update
    }
  })

  socket.on('user-joined', (roomName: string, username: string) => {
    let room = getRoom(roomName)
    room.users.push({
      socketID: socket.id,
      name: username,
      ready: false,
      left: false,
      won: 0,
      cards: [],
      taxCards: [],
      taxSubmitted: false
    })
    // emit update
  })

  socket.on('user-left', (roomName: string) => {
    let room = getRoom(roomName)

    if (room.state !== GameState.Play) {
      room.users = room.users.filter(user => user.socketID !== socket.id)
      if (room.state === GameState.Tax) {
        startTax(getRoom(roomName))
      }
    } else {
      getUserByRoom(room, socket.id).left = true
    }
    // emit update
  })

  socket.on('ready-toggle', (roomName: string, readyStatus: boolean) => {
    let room = getRoom(roomName)

    getUserByRoom(room, socket.id).ready = readyStatus
    // check if game should start
    if (room.state === GameState.Lobby && room.users.length >= 4) {
      let shouldStart = true
      room.users
        .map(user => user.ready)
        .forEach(ready => {
          if (!ready) {
            shouldStart = false
          }
        })
      if (shouldStart) {
        startGame(room)
      }
    }
    // emit update
  })

  socket.on('revolution', (roomName: string) => {
    // TODO: different handling for greater revolution
    let room = getRoom(roomName)
    clearInterval(room.revolutionInterval)
    room.revolutionTimer = REVOLUTION_LENGTH + 1
    room.state = GameState.Play
    // emit update
  })

  socket.on('tax-select', (roomName: string, selectedCards: number[]) => {
    let room = getRoom(roomName)

    let index = room.users.map(user => user.socketID).indexOf(socket.id)
    if (
      index === 0 &&
      !room.users[0].taxSubmitted &&
      selectedCards.length === 2
    ) {
      room.users[0].taxSubmitted = true
      room.users[0].taxCards = selectedCards
    } else if (
      index === 1 &&
      !room.users[1].taxSubmitted &&
      selectedCards.length === 1
    ) {
      room.users[1].taxSubmitted = true
      room.users[1].taxCards = selectedCards
    }

    // everyone else should have tax submitted anyways
    if (room.users[0].taxSubmitted && room.users[1].taxSubmitted) {
      taxSelected(room)
    }
    // emit update
  })

  socket.on('play', (roomName: string, selectedCards: number[]) => {
    let room = getRoom(roomName)
    let user = getUserByRoom(room, socket.id)

    if (room.currentPlayer === user.name) {
      let uniqueCards = [...new Set(selectedCards)]
      // selectedCards is sorted
      if (uniqueCards.length === 1 || uniqueCards[1] === JOKER) {
        let index = room.users.indexOf(user)
        let nextIndex = index === room.users.length - 1 ? 0 : index + 1
        while (room.users[nextIndex].left || room.users[nextIndex].won > 0) {
          nextIndex = nextIndex + 1 === room.users.length ? 0 : nextIndex + 1
        }

        if (
          room.currentCard === 0 ||
          (selectedCards.length === room.currentCardCount &&
            selectedCards[0] < room.currentCard)
        ) {
          // start of the hand || valid hand
          room.currentCardCount = selectedCards.length
          room.currentCard = selectedCards[0]
          room.currentPlayer = room.users[nextIndex].name
          room.trickLead = room.currentPlayer
          removeCards(user, selectedCards)

          // check if user won
          if (user.cards.length === 0) {
            let biggestWon = 0
            let remainingPlayers = -1 // current player hasn't won yet
            room.users.forEach(user => {
              biggestWon = Math.max(biggestWon, user.won)
              if (!user.left && user.won) {
                remainingPlayers++
              }
            })
            user.won = biggestWon + 1
            if (remainingPlayers === 1) {
              restart(room)
            }
          }
        } else {
          // not a valid play
          // emit something
        }
      } else {
        // emit error
      }
    }
  })

  socket.on('pass', (roomName: string) => {
    let room = getRoom(roomName)
    let user = getUserByRoom(room, socket.id)

    if (room.currentPlayer === user.name && room.trickLead !== user.name) {
      let index = room.users.indexOf(user)
      let nextIndex = index === room.users.length - 1 ? 0 : index + 1
      while (room.users[nextIndex].left || room.users[nextIndex].won > 0) {
        nextIndex = nextIndex + 1 === room.users.length ? 0 : nextIndex + 1
      }
      room.currentPlayer = room.users[nextIndex].name
      if (room.currentPlayer === room.trickLead) {
        // trick won
        room.currentCard = 0
        room.currentCardCount = 0
      }
    } else {
      // emit error
    }
  })

  // reconsider this
  socket.on('request-rooms', () => {
    socket.emit('room-update', rooms)
  })

  socket.on('request-socketid', () => {
    socket.emit('socketid', socket.id)
  })
})

function emitRoomList() {
  let roomList = rooms.map(room => {
    return {
      name: room.name,
      joinable: room.state === GameState.Lobby,
      playerCount: room.users.filter(user => !user.left).length
    }
  })
  // emit
}

function emitUserList(room: Room) {
  let userList = room.users.map(user => {
    return {
      name: user.name,
      ready: user.ready,
      left: user.left,
      won: user.won,
      cardCount: user.cards.length
    }
  })
  // emit
}

function emitGameState(room: Room) {
  let gameState = {
    state: room.state,
    currentPlayer: room.currentPlayer,
    trickLead: room.trickLead,
    currentCard: room.currentCard,
    currentCardCount: room.currentCardCount,
    revolutionTimer: room.revolutionTimer
  }
}

function emitUserState(room: Room, user: User) {
  let userState = {
    cards: user.cards,
    taxSubmitted: user.taxSubmitted,
    taxCards: user.taxCards
  }
}

function startGame(room: Room) {
  if (room.firstRound) {
    shuffle(room.users)
  }

  let deck = []
  let maxCard = 0 // more sophisticated algorithm would be good
  if (room.users.length === 4) maxCard = 10
  else if (room.users.length === 5) maxCard = 11
  else maxCard = 12

  for (let i = 1; i <= maxCard; i++) {
    for (let j = 0; j < i; j++) {
      deck.push(i)
    }
  }
  deck.push(JOKER)
  deck.push(JOKER)

  shuffle(deck)

  let perPerson = Math.floor(deck.length / room.users.length)
  let remainder = deck.length % room.users.length

  for (let i = 0; i < room.users.length; i++) {
    room.users[i].cards = deck.splice(0, perPerson) // also replaces cards
  }

  for (let i = 0; i < remainder; i++) {
    room.users[i].cards.push(deck.splice(0, 1)[0])
  }

  for (let i = 0; i < room.users.length; i++) {
    room.users[i].cards.sort(CARD_ORDER)
  }

  room.state = GameState.Revolution

  room.revolutionInterval = setInterval(() => {
    room.revolutionTimer--
    if (room.revolutionTimer >= 0) {
      io.emit('revolution-timer-update', room.revolutionTimer)
    } else {
      room.state = GameState.Tax
      startTax(room)
      io.emit('room-update', rooms)

      clearInterval(room.revolutionInterval)
    }
  }, 1000)
}

function startTax(room: Room) {
  room.users.forEach((user, i) => {
    if (i === room.users.length - 1) {
      // greater pion
      user.taxCards = user.cards.slice(0, 2)
      user.taxSubmitted = true
    } else if (i === room.users.length - 2) {
      // lesser pion
      user.taxCards = user.cards.slice(0, 1)
      user.taxSubmitted = true
    } else if (i >= 2) {
      // merchants
      user.taxCards = []
      user.taxSubmitted = true
    }
  })
}

function taxSelected(room: Room) {
  let gd = room.users[0]
  let ld = room.users[1]
  let lp = room.users[room.users.length - 2]
  let gp = room.users[room.users.length - 1]

  tradeTax(gd, gp)
  tradeTax(ld, lp)

  room.state = GameState.Play
  room.currentPlayer = gd.name
}

function tradeTax(a: User, b: User) {
  // remove tax cards from users
  removeCards(a, a.taxCards)
  removeCards(b, b.taxCards)

  // give cards to the other
  a.cards.push(...b.taxCards)
  b.cards.push(...a.taxCards)

  // sort hands
  a.cards.sort(CARD_ORDER)
  b.cards.sort(CARD_ORDER)
}

function removeCards(user: User, cards: number[]) {
  cards.forEach(card => {
    user.cards.splice(user.cards.indexOf(card), 1)
  })
}

function restart(room: Room) {
  room.users.filter(user => user.left)
  room.users.sort((a, b) => {
    if (a.won === 0) {
      return 1
    }
    if (b.won === 0) {
      return -1
    }
    return a.won - b.won
  })
  room.users.forEach(user => {
    user.cards = []
    user.ready = false
    user.taxSubmitted = false
    user.taxCards = []
    user.won = 0
  })

  room.currentCard = 0
  room.currentCardCount = 0
  room.currentPlayer = ''
  room.trickLead = ''
  room.revolutionInterval = null
  room.revolutionTimer = REVOLUTION_LENGTH + 1

  room.state = GameState.Lobby
  room.firstRound = false
}

function getRoom(roomName: string): Room {
  rooms.forEach(room => {
    if (room.name === roomName) {
      return room
    }
  })
  return null
}

function getUser(roomName: string, socketID: string): User {
  return getUserByRoom(getRoom(roomName), socketID)
}

function getUserByRoom(room: Room, socketID: string): User {
  if (!room) {
    return null
  }
  room.users.forEach(user => {
    if (user.socketID === socketID) {
      return user
    }
  })
  return null
}

function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
