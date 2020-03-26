const express = require('express')()
const http = require('http').Server(express)
const io = require('socket.io')(http)

const PORT = process.env.PORT || 3560

http.listen(PORT, () => {
  console.log(`Listening at :${PORT}...`)
})

interface User {
  socketID: string
  username: string // i want to change this to name, User.username is a bit dumb
  ready: boolean
  left: boolean
  cards: number[] // hopefully i can restrict it to be 1-13 or something
}

// add "started"
interface Room {
  name: string
  started: boolean
  users: User[]
}

let rooms: Room[] = []

io.on('connection', socket => {
  socket.emit('room-update', rooms)

  socket.on('room-created', (roomName: string) => {
    if (rooms.filter(room => roomName === room.name).length === 0) {
      rooms.push({
        name: roomName,
        started: false,
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
          username: username,
          ready: false,
          left: false,
          cards: []
        })
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('user-left', (roomName: string) => {
    rooms.forEach(room => {
      if (room.name === roomName) {
        if (room.started) {
          room.users.forEach(user => {
            if (user.socketID === socket.id) {
              user.left = true
            }
          })
        } else {
          room.users = room.users.filter(user => user.socketID !== socket.id)
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
        if (!room.started && room.users.length >= 4) {
          let shouldStart = true
          room.users
            .map(user => user.ready)
            .forEach(ready => {
              if (!ready) {
                shouldStart = false
              }
            })
          if (shouldStart) {
            // should probably put this in a separate method lol
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

            room.started = true
          }
        }
      }
    })
    io.emit('room-update', rooms)
  })

  socket.on('request-rooms', () => {
    socket.emit('room-update', rooms)
  })

  socket.on('request-socketid', () => {
    socket.emit('socketid', socket.id)
  })

  // socket.on('disconnect', () => {
  //   rooms.forEach(room => {
  //     rooms.forEach(room => {
  //       if (room.started) {
  //         room.users.forEach(user => {
  //           if (user.socketID === socket.id) {
  //             user.left = true
  //           }
  //         })
  //       } else {
  //         room.users = room.users.filter(user => user.socketID !== socket.id)
  //       }
  //     })
  //   })
  //   io.emit('room-update', rooms)
  // })
})

function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
