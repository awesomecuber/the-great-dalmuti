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
}

const REVOLUTION_LENGTH = 5
const CARD_ORDER = (a: number, b: number) => a - b

let rooms: Room[] = []

io.on('connection', socket => {
  socket.emit('room-update', rooms)

  socket.on('room-created', (roomName: string) => {
    if (rooms.filter(room => roomName === room.name).length === 0) {
      rooms.push({
        name: roomName,
        trickLead: '',
        currentPlayer: '',
        currentCard: 0,
        currentCardCount: 0,
        state: GameState.Lobby,
        users: [],
        revolutionTimer: REVOLUTION_LENGTH + 1,
        revolutionInterval: null
      })
      io.emit('room-update', rooms)
    }
  })

  socket.on('room-removed', (roomName: string) => {
    let sizeBefore = rooms.length
    rooms = rooms.filter(room => room.name !== roomName)
    if (sizeBefore !== rooms.length) {
      io.emit('room-update', rooms)
    }
  })

  socket.on('user-joined', (roomName: string, username: string) => {
    let room = getRoom(roomName)
    room.users.push({
      socketID: socket.id,
      name: username,
      ready: false,
      left: false,
      cards: [],
      taxCards: [],
      taxSubmitted: false
    })
    io.emit('room-update', rooms)
  })

  socket.on('user-left', (roomName: string) => {
    let room = getRoom(roomName)

    if (room.state !== GameState.Play) {
      room.users = room.users.filter(user => user.socketID !== socket.id)
      // if its tax phase, figure out if taxes need to be redone
    } else {
      getUserByRoom(room, socket.id).left = true
    }
    io.emit('room-update', rooms)
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
    io.emit('room-update', rooms)
  })

  socket.on('revolution', (roomName: string) => {
    let room = getRoom(roomName)
    clearInterval(room.revolutionInterval)
    room.revolutionTimer = REVOLUTION_LENGTH + 1
    room.state = GameState.Play
    io.emit('room-update', rooms)
  })

  socket.on('tax-select', (roomName: string, selectedCards: number[]) => {
    let room = getRoom(roomName)

    let index = room.users.map(user => user.socketID).indexOf(socket.id)
    if (
      index === 0 &&
      !room.users[0].taxSubmitted &&
      selectedCards.length == 2
    ) {
      room.users[0].taxSubmitted = true
      room.users[0].taxCards = selectedCards
    } else if (
      index === 1 &&
      !room.users[1].taxSubmitted &&
      selectedCards.length == 1
    ) {
      room.users[1].taxSubmitted = true
      room.users[1].taxCards = selectedCards
    }

    // everyone else should have tax submitted anyways
    if (room.users[0].taxSubmitted && room.users[1].taxSubmitted) {
      taxSelected(room)
    }
    io.emit('room-update', rooms)
  })

  socket.on('play', (roomName: string, selectedCards: number[]) => {
    let room = getRoom(roomName)
    let user = getUserByRoom(room, socket.id)

    if (user.socketID === socket.id) {
      if (room.currentCard === 0) {
        // check if selectedCards is valid
      } else if (selectedCards.length === room.currentCardCount) {
        // check if selectedCards is valid
      } else {
        // definitely not valid
      }
    }
  })

  socket.on('pass', (roomName: string) => {})

  socket.on('request-rooms', () => {
    socket.emit('room-update', rooms)
  })

  socket.on('request-socketid', () => {
    socket.emit('socketid', socket.id)
  })
})

function startGame(room: Room) {
  shuffle(room.users) // todo: make it so that the winner of the last game is first etc

  let deck = []
  let maxCard = 0 // more sophisticated algorithm would be good
  if (room.users.length == 4) maxCard = 10
  else if (room.users.length == 5) maxCard = 11
  else maxCard = 12

  for (let i = 1; i <= maxCard; i++) {
    for (let j = 0; j < i; j++) {
      deck.push(i)
    }
  }
  deck.push(99) // jokers
  deck.push(99) // jokers

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
      room.revolutionTimer = REVOLUTION_LENGTH + 1
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
  a.taxCards.forEach(taxCard => {
    a.cards.splice(a.cards.indexOf(taxCard), 1)
  })
  b.taxCards.forEach(taxCard => {
    b.cards.splice(b.cards.indexOf(taxCard), 1)
  })

  // give cards to the other
  a.cards.push(...b.taxCards)
  b.cards.push(...a.taxCards)

  // sort hands
  a.cards.sort(CARD_ORDER)
  b.cards.sort(CARD_ORDER)

  a.taxCards = []
  a.taxSubmitted = false

  b.taxCards = []
  b.taxSubmitted = false
}

function getRoom(roomName: string): Room {
  rooms.forEach(room => {
    if (room.name === roomName) {
      return room
    }
  })
  return null
}

function getUser(roomName: string, socketID: any): User {
  return getUserByRoom(getRoom(roomName), socketID)
}

function getUserByRoom(room: Room, socketID: any): User {
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
