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
}

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
        users: []
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
    rooms.forEach(room => {
      if (room.name === roomName) {
        room.users.push({
          socketID: socket.id,
          name: username,
          ready: false,
          left: false,
          cards: [],
          taxCards: [],
          taxSubmitted: false
        })
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('user-left', (roomName: string) => {
    rooms.forEach(room => {
      if (room.name === roomName) {
        if (room.state !== GameState.Play) {
          room.users = room.users.filter(user => user.socketID !== socket.id)
          // if its tax phase, figure out if taxes need to be redone
        } else {
          room.users.forEach(user => {
            if (user.socketID === socket.id) {
              user.left = true
            }
          })
        }
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('ready-toggle', (roomName: string, readyStatus: boolean) => {
    // lmao this is very ugly
    rooms.forEach(room => {
      if (room.name === roomName) {
        room.users.forEach(user => {
          if (user.socketID === socket.id) {
            user.ready = readyStatus
          }
        })
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
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('revolution', (roomName: string) => {
    // how the  heck am i gonna stop the revolution timer interval thing
  })

  socket.on('tax-select', (roomName: string, selectedCards: number[]) => {
    rooms.forEach(room => {
      if (room.name === roomName) {
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
        if (room.users[0].taxSubmitted && room.users[1].taxSubmitted) {
          taxSelected(room)
        }
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('play', (roomName: string, selectedCards: number[]) => {
    rooms.forEach(room => {
      if (room.name === roomName) {
        room.users.forEach(user => {
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
      }
    })
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
    room.users[i].cards.sort((a, b) => a - b)
  }

  room.state = GameState.Revolution

  let revolutionTimer = 6
  let revolutionInterval = setInterval(() => {
    revolutionTimer--
    if (revolutionTimer >= 0) {
      io.emit('revolution-timer-update', revolutionTimer)
    } else {
      room.state = GameState.Tax
      io.emit('room-update', rooms)
      clearInterval(revolutionInterval)
    }
  }, 1000)
}

function taxSelected(room: Room) {
  let gd = room.users[0]
  let ld = room.users[1]
  let lp = room.users[room.users.length - 2]
  let gp = room.users[room.users.length - 1]

  // greater trade
  gd.cards.splice(gd.cards.indexOf(gd.taxCards[0]), 1)
  gd.cards.splice(gd.cards.indexOf(gd.taxCards[1]), 1)
  gd.cards.push(...gp.cards.splice(0, 2))
  gp.cards.push(...gd.taxCards)
  gd.cards.sort((a, b) => a - b)
  gp.cards.sort((a, b) => a - b)

  gd.taxCards = []
  gd.taxSubmitted = false

  // lesser trade
  ld.cards.splice(ld.cards.indexOf(ld.taxCards[0]), 1)
  ld.cards.push(...lp.cards.splice(0, 1))
  lp.cards.push(...ld.taxCards)
  ld.cards.sort((a, b) => a - b)
  lp.cards.sort((a, b) => a - b)

  ld.taxCards = []
  ld.taxSubmitted = false

  room.state = GameState.Play
  room.currentPlayer = gd.name
}

function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
