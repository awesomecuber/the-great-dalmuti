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
                count: 0
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

    socket.on('user-joined', roomName => {
        rooms.forEach(room => {
            if (room.name === roomName) room.count++
        })
        socket.join(roomName)
        socket.to(roomName).emit('user-join')
        io.emit('room-update', rooms)
    })

    socket.on('user-left', roomName => {
        rooms.forEach(room => {
            if (room.name === roomName) room.count--
        })
        socket.leave(roomName)
        socket.to(roomName).emit('user-leave')
        io.emit('room-update', rooms)
    })

    socket.on('message-sent', (roomName, message) => {
        socket.to(roomName).broadcast.emit('new-message', message)
    })
})