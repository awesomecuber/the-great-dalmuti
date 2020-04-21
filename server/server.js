const express = require('express')();
const http = require('http').Server(express);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Listening at :${PORT}...`);
});
var GameState;
(function (GameState) {
    GameState["Lobby"] = "LOBBY";
    GameState["Revolution"] = "REVOLUTION";
    GameState["Tax"] = "TAX";
    GameState["Play"] = "PLAY";
})(GameState || (GameState = {}));
const REVOLUTION_LENGTH = 5;
const CARD_ORDER = (a, b) => a - b;
const JOKER = 99;
let rooms = [];
io.on('connection', socket => {
    socket.on('create-room', (roomName) => {
        if (!rooms.map(room => room.name).includes(roomName)) {
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
            });
            emitRoomList();
        }
    });
    socket.on('remove-room', (roomName) => {
        if (rooms.map(room => room.name).includes(roomName)) {
            rooms = rooms.filter(room => room.name !== roomName);
            emitRoomList();
        }
    });
    socket.on('enter-room', (roomName) => {
        let room = getRoom(roomName);
        if (room) {
            socket.join(room.name);
            emitUserList(room);
        }
    });
    socket.on('join-room', (roomName, username) => {
        let room = getRoom(roomName);
        if (room && !room.users.map(user => user.name).includes(username)) {
            room.users.push({
                socketID: socket.id,
                name: username,
                ready: false,
                left: false,
                won: 0,
                cards: [],
                taxCardIndexes: [],
                taxSubmitted: false
            });
            socket.join(room.name);
            emitRoomList(); // player count change
            emitUserList(room);
            emitUserState(getUserByRoom(room, socket.id));
        }
    });
    socket.on('leave-room', (roomName) => {
        let room = getRoom(roomName);
        let user = getUserByRoom(room, socket.id);
        if (room) {
            console.log((user ? user.name : '(a ghost)') + ' left from ' + room.name);
            socket.leave(room.name);
            if (room.users.map(user => user.socketID).includes(socket.id)) {
                if (room.state === GameState.Play) {
                    user.left = true;
                    let index = room.users.indexOf(user);
                    let nextIndex = index === room.users.length - 1 ? 0 : index + 1;
                    while (room.users[nextIndex].left || room.users[nextIndex].won > 0) {
                        nextIndex = nextIndex + 1 === room.users.length ? 0 : nextIndex + 1;
                    }
                    if (room.trickLead === user.name && room.currentPlayer === user.name) {
                        room.trickLead = room.users[nextIndex].name;
                        room.currentPlayer = room.users[nextIndex].name;
                    }
                    else if (room.currentPlayer === user.name) {
                        room.currentPlayer = room.users[nextIndex].name;
                    }
                }
                else {
                    room.users = room.users.filter(user => user.socketID !== socket.id);
                    if (room.state === GameState.Tax) {
                        startTax(getRoom(roomName));
                    }
                }
                if (room.state !== GameState.Lobby && room.users.filter(user => !user.left).length < 4) {
                    rooms = rooms.filter(room => room.name !== roomName);
                }
                else if (room.state === GameState.Tax) {
                    emitAllUserState(room);
                }
                emitRoomList(); // player count change
                emitUserList(room);
            }
        }
    });
    socket.on('toggle-ready', (roomName, readyStatus) => {
        let room = getRoom(roomName);
        let user = getUserByRoom(room, socket.id);
        if (user) {
            user.ready = readyStatus;
            // check if game should start
            if (room.state === GameState.Lobby && room.users.length >= 4) {
                let shouldStart = true;
                room.users
                    .map(user => user.ready)
                    .forEach(ready => {
                    if (!ready) {
                        shouldStart = false;
                    }
                });
                if (shouldStart) {
                    startGame(room);
                    emitRoomList(); // joinable is changed
                    emitGameState(room);
                    emitAllUserState(room);
                }
            }
            emitUserList(room);
        }
    });
    socket.on('call-revolution', (roomName) => {
        // TODO: different handling for greater revolution
        let room = getRoom(roomName);
        if (room) {
            clearInterval(room.revolutionInterval);
            room.state = GameState.Play;
            room.currentPlayer = room.users[0].name;
            emitGameState(room);
        }
    });
    socket.on('select-tax', (roomName, selectedCardIndexes) => {
        let room = getRoom(roomName);
        let user = getUserByRoom(room, socket.id);
        if (user && !user.taxSubmitted) {
            let index = room.users.indexOf(user);
            if (index === 0 &&
                !user.taxSubmitted &&
                selectedCardIndexes.length === 2) {
                user.taxSubmitted = true;
                user.taxCardIndexes = selectedCardIndexes;
                emitUserState(user);
            }
            else if (index === 1 &&
                !user.taxSubmitted &&
                selectedCardIndexes.length === 1) {
                user.taxSubmitted = true;
                user.taxCardIndexes = selectedCardIndexes;
                emitUserState(user);
            }
            // everyone else should have tax submitted anyways
            if (room.users[0].taxSubmitted && room.users[1].taxSubmitted) {
                taxSelected(room);
                emitGameState(room);
                emitAllUserState(room);
            }
        }
    });
    socket.on('play-hand', (roomName, selectedCardIndexes) => {
        let room = getRoom(roomName);
        let user = getUserByRoom(room, socket.id);
        let selectedCards = indexesToCards(user, selectedCardIndexes);
        if (user && room.currentPlayer === user.name) {
            let uniqueCards = [...new Set(selectedCards)];
            // selectedCards is sorted
            if (uniqueCards.length === 1 || uniqueCards[1] === JOKER) {
                let index = room.users.indexOf(user);
                let nextIndex = index === room.users.length - 1 ? 0 : index + 1;
                while (room.users[nextIndex].left || room.users[nextIndex].won > 0) {
                    nextIndex = nextIndex + 1 === room.users.length ? 0 : nextIndex + 1;
                }
                if (room.currentCard === 0 ||
                    (selectedCards.length === room.currentCardCount &&
                        selectedCards[0] < room.currentCard)) {
                    // start of the hand || valid hand
                    room.currentCardCount = selectedCards.length;
                    room.currentCard = selectedCards[0];
                    room.trickLead = room.currentPlayer;
                    room.currentPlayer = room.users[nextIndex].name;
                    removeCards(user, selectedCards);
                    // check if user won
                    if (user.cards.length === 0) {
                        let biggestWon = 0;
                        let remainingPlayers = -1; // current player hasn't won yet
                        room.users.forEach(user => {
                            biggestWon = Math.max(biggestWon, user.won);
                            if (!user.left && user.won) {
                                remainingPlayers++;
                            }
                        });
                        user.won = biggestWon + 1;
                        if (remainingPlayers === 1) {
                            restart(room);
                            emitUserList(room); // everything reset
                            emitGameState(room); // lobby
                            emitAllUserState(room); // everything reset
                        }
                        else {
                            emitUserList(room); // card count+won
                            emitGameState(room); // current player etc
                            emitUserState(user); // player lost cards
                        }
                    }
                    else {
                        emitUserList(room); // card count
                        emitGameState(room); // current player etc
                        emitUserState(user); // player lost cards
                    }
                }
                else {
                    // not a valid play
                    // emit something
                }
            }
            else {
                // not a valid play
                // emit something
            }
        }
    });
    socket.on('pass-turn', (roomName) => {
        let room = getRoom(roomName);
        let user = getUserByRoom(room, socket.id);
        if (user && room.currentPlayer === user.name && room.trickLead !== user.name) {
            let index = room.users.indexOf(user);
            let nextIndex = index === room.users.length - 1 ? 0 : index + 1;
            let reachTrickLeader = false;
            if (room.trickLead === room.users[nextIndex].name) {
                reachTrickLeader = true;
            }
            while (room.users[nextIndex].left || room.users[nextIndex].won > 0) {
                nextIndex = nextIndex + 1 === room.users.length ? 0 : nextIndex + 1;
                if (room.trickLead === room.users[nextIndex].name) {
                    reachTrickLeader = true;
                }
            }
            room.currentPlayer = room.users[nextIndex].name;
            if (reachTrickLeader) {
                // trick won
                room.currentCard = 0;
                room.currentCardCount = 0;
                room.trickLead = room.currentPlayer;
            }
            emitGameState(room);
        }
        else {
            // emit error
        }
    });
    emitRoomList();
});
function emitRoomList() {
    let roomList = rooms.map(room => {
        return {
            name: room.name,
            joinable: room.state === GameState.Lobby,
            playerCount: room.users.filter(user => !user.left).length
        };
    });
    io.emit('room-list-update', roomList);
}
function emitUserList(room) {
    let userList = room.users.map(user => {
        return {
            name: user.name,
            ready: user.ready,
            left: user.left,
            won: user.won,
            cardCount: user.cards.length
        };
    });
    io.in(room.name).emit('user-list-update', userList);
}
function emitGameState(room) {
    let gameState = {
        roomName: room.name,
        state: room.state,
        currentPlayer: room.currentPlayer,
        trickLead: room.trickLead,
        currentCard: room.currentCard,
        currentCardCount: room.currentCardCount,
        revolutionTimer: room.revolutionTimer
    };
    io.in(room.name).emit('game-state-update', gameState);
}
function emitUserState(user) {
    let userState = {
        name: user.name,
        cards: user.cards,
        taxSubmitted: user.taxSubmitted,
        taxCardIndexes: user.taxCardIndexes
    };
    io.to(user.socketID).emit('user-state-update', userState);
}
function emitAllUserState(room) {
    room.users.forEach(user => emitUserState(user));
}
function startGame(room) {
    if (room.firstRound) {
        shuffle(room.users);
    }
    let deck = [];
    let maxCard = 0; // more sophisticated algorithm would be good
    if (room.users.length === 4)
        maxCard = 10;
    else if (room.users.length === 5)
        maxCard = 11;
    else
        maxCard = 12;
    // FOR TESTING
    //maxCard = 3
    for (let i = 1; i <= maxCard; i++) {
        for (let j = 0; j < i; j++) {
            deck.push(i);
        }
    }
    deck.push(JOKER);
    deck.push(JOKER);
    shuffle(deck);
    let perPerson = Math.floor(deck.length / room.users.length);
    let remainder = deck.length % room.users.length;
    for (let i = 0; i < room.users.length; i++) {
        room.users[i].cards = deck.splice(0, perPerson); // also replaces cards
    }
    for (let i = 0; i < remainder; i++) {
        room.users[i].cards.push(deck.splice(0, 1)[0]);
    }
    for (let i = 0; i < room.users.length; i++) {
        room.users[i].cards.sort(CARD_ORDER);
    }
    room.state = GameState.Revolution;
    room.revolutionInterval = setInterval(() => {
        room.revolutionTimer--;
        console.log(room.revolutionTimer);
        if (room.revolutionTimer >= 0) {
            emitGameState(room);
        }
        else {
            room.state = GameState.Tax;
            startTax(room);
            emitAllUserState(room);
            emitGameState(room);
            clearInterval(room.revolutionInterval);
        }
    }, 1000);
}
function startTax(room) {
    room.users.forEach((user, i) => {
        if (i === room.users.length - 1) {
            // greater pion
            user.taxCardIndexes = [0, 1];
            user.taxSubmitted = true;
        }
        else if (i === room.users.length - 2) {
            // lesser pion
            user.taxCardIndexes = [0];
            user.taxSubmitted = true;
        }
        else if (i >= 2) {
            // merchants
            user.taxCardIndexes = [];
            user.taxSubmitted = true;
        }
    });
}
function taxSelected(room) {
    let gd = room.users[0];
    let ld = room.users[1];
    let lp = room.users[room.users.length - 2];
    let gp = room.users[room.users.length - 1];
    tradeTax(gd, gp);
    tradeTax(ld, lp);
    room.state = GameState.Play;
    room.currentPlayer = gd.name;
    room.trickLead = room.currentPlayer;
}
function tradeTax(a, b) {
    // remove tax cards from users
    let aTaxCards = indexesToCards(a, a.taxCardIndexes);
    let bTaxCards = indexesToCards(b, b.taxCardIndexes);
    removeCards(a, aTaxCards);
    removeCards(b, bTaxCards);
    // give cards to the other
    a.cards.push(...bTaxCards);
    b.cards.push(...aTaxCards);
    // sort hands
    a.cards.sort(CARD_ORDER);
    b.cards.sort(CARD_ORDER);
}
function removeCards(user, cards) {
    cards.forEach(card => {
        user.cards.splice(user.cards.indexOf(card), 1);
    });
}
function restart(room) {
    room.users.filter(user => user.left);
    room.users.sort((a, b) => {
        if (a.won === 0) {
            return 1;
        }
        if (b.won === 0) {
            return -1;
        }
        return a.won - b.won;
    });
    room.users.forEach(user => {
        user.cards = [];
        user.ready = false;
        user.taxSubmitted = false;
        user.taxCardIndexes = [];
        user.won = 0;
    });
    room.currentCard = 0;
    room.currentCardCount = 0;
    room.currentPlayer = '';
    room.trickLead = '';
    room.revolutionInterval = null;
    room.revolutionTimer = REVOLUTION_LENGTH + 1;
    room.state = GameState.Lobby;
    room.firstRound = false;
}
function getRoom(roomName) {
    let roomFound = null;
    rooms.forEach(room => {
        if (room.name === roomName) {
            roomFound = room;
        }
    });
    return roomFound;
}
function getUser(roomName, socketID) {
    return getUserByRoom(getRoom(roomName), socketID);
}
function getUserByRoom(room, socketID) {
    let userFound = null;
    if (room) {
        room.users.forEach(user => {
            if (user.socketID === socketID) {
                userFound = user;
            }
        });
    }
    return userFound;
}
function indexesToCards(user, indexes) {
    return indexes.map(index => user.cards[index]);
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
