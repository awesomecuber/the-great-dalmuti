const express = require("express")()
const http = require("http").Server(express)
const io = require("socket.io")(http)

const PORT = process.env.PORT || 3500

http.listen(PORT, () => {
    console.log(`Listening at :${PORT}...`)
})

interface User {
    socketID: string,
    username: string,
    ready: boolean
}

interface Room {
    name: string,
    users: User[]
}

let rooms: Room[] = [{
    name: 'yo',
    users: []
}]

io.on("connection", socket => {
    socket.emit('room-update', rooms)
    
    socket.on('room-created', (roomName: string) => {
        if (rooms.filter(room => roomName === room.name).length === 0) {
            rooms.push({
                name: roomName,
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
            if (room.name === roomName) room.users.push({
                socketID: socket.id,
                username: username,
                ready: false
            })
        })
        io.emit('room-update', rooms)
    })

    socket.on('user-left', (roomName: string) => {
        rooms.forEach(room => {
            if (room.name === roomName) {
                room.users = room.users.filter(user => user.socketID !== socket.id)
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
            }
        })
        io.emit('room-update', rooms)
    })

    socket.on('request-rooms', () => {
        socket.emit('room-update', rooms)
    })

    socket.on('request-socketid', () => {
        socket.emit('socket-id', socket.id)
    })

    socket.on('disconnect', () => {
        rooms.forEach(room => {
            room.users = room.users.filter(user => user.socketID !== socket.id)
        })
        socket.emit('room-update', rooms)
    })
})