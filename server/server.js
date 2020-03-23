const express = require("express")()
const http = require("http").Server(express)
const io = require("socket.io")(http)

const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
    console.log(`Listening at :${PORT}...`)
})

let rooms = []

io.on("connection", socket => {
    io.emit('room-update', rooms)

    socket.on('room-created', roomName => {
        if (rooms.filter(room => roomName === room.name).length === 0) {
            rooms.push({
                name: roomName,
                users: []
            })
            io.emit('room-update', rooms)
        }
    })

    socket.on('room-removed', roomName => {
        let sizeBefore = rooms.length
        rooms = rooms.filter(room => room.name !== roomName)
        if (sizeBefore !== rooms.length) {
            io.emit('room-update', rooms)
        }
    })

    socket.on('user-joined', (roomName, username) => {
        rooms.forEach(room => {
            if (room.name === roomName) room.users.push(username)
        })
        io.emit('room-update', rooms)
    })

    socket.on('user-left', (roomName, username) => {
        rooms.forEach(room => {
            if (room.name === roomName) {
                room.users = room.users.filter(user => user !== username)
            }
        })
        io.emit('room-update', rooms)
    })

    socket.on('request-rooms', () => {
        socket.emit('room-update', rooms)
    })
})