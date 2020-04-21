var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var express = require('express')();
var http = require('http').Server(express);
var io = require('socket.io')(http);
var PORT = process.env.PORT || 3000;
http.listen(PORT, function () {
    console.log("Listening at :" + PORT + "...");
});
var GameState;
(function (GameState) {
    GameState["Lobby"] = "LOBBY";
    GameState["Revolution"] = "REVOLUTION";
    GameState["Tax"] = "TAX";
    GameState["Play"] = "PLAY";
})(GameState || (GameState = {}));
var REVOLUTION_LENGTH = 5;
var CARD_ORDER = function (a, b) { return a - b; };
var JOKER = 99;
var rooms = [];
io.on('connection', function (socket) {
    socket.on('create-room', function (roomName) {
        if (!rooms.map(function (room) { return room.name; }).includes(roomName)) {
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
    socket.on('remove-room', function (roomName) {
        if (rooms.map(function (room) { return room.name; }).includes(roomName)) {
            rooms = rooms.filter(function (room) { return room.name !== roomName; });
            emitRoomList();
        }
    });
    socket.on('enter-room', function (roomName) {
        var room = getRoom(roomName);
        if (room) {
            socket.join(room.name);
            emitUserList(room);
        }
    });
    socket.on('join-room', function (roomName, username) {
        var room = getRoom(roomName);
        if (room && !room.users.map(function (user) { return user.name; }).includes(username)) {
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
    socket.on('leave-room', function (roomName) {
        var room = getRoom(roomName);
        var user = getUserByRoom(room, socket.id);
        if (room) {
            console.log((user ? user.name : '(a ghost)') + ' left from ' + room.name);
            socket.leave(room.name);
            if (room.users.map(function (user) { return user.socketID; }).includes(socket.id)) {
                if (room.state === GameState.Play) {
                    user.left = true;
                    var index = room.users.indexOf(user);
                    var nextIndex = index === room.users.length - 1 ? 0 : index + 1;
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
                    room.users = room.users.filter(function (user) { return user.socketID !== socket.id; });
                    if (room.state === GameState.Tax) {
                        startTax(getRoom(roomName));
                    }
                }
                if (room.state !== GameState.Lobby && room.users.filter(function (user) { return !user.left; }).length < 4) {
                    rooms = rooms.filter(function (room) { return room.name !== roomName; });
                }
                else if (room.state === GameState.Tax) {
                    emitAllUserState(room);
                }
                emitRoomList(); // player count change
                emitUserList(room);
            }
        }
    });
    socket.on('toggle-ready', function (roomName, readyStatus) {
        var room = getRoom(roomName);
        var user = getUserByRoom(room, socket.id);
        if (user) {
            user.ready = readyStatus;
            // check if game should start
            if (room.state === GameState.Lobby && room.users.length >= 4) {
                var shouldStart_1 = true;
                room.users
                    .map(function (user) { return user.ready; })
                    .forEach(function (ready) {
                    if (!ready) {
                        shouldStart_1 = false;
                    }
                });
                if (shouldStart_1) {
                    startGame(room);
                    emitRoomList(); // joinable is changed
                    emitGameState(room);
                    emitAllUserState(room);
                }
            }
            emitUserList(room);
        }
    });
    socket.on('call-revolution', function (roomName) {
        // TODO: different handling for greater revolution
        var room = getRoom(roomName);
        if (room) {
            clearInterval(room.revolutionInterval);
            room.state = GameState.Play;
            room.currentPlayer = room.users[0].name;
            emitGameState(room);
        }
    });
    socket.on('select-tax', function (roomName, selectedCardIndexes) {
        var room = getRoom(roomName);
        var user = getUserByRoom(room, socket.id);
        if (user && !user.taxSubmitted) {
            var index = room.users.indexOf(user);
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
    socket.on('play-hand', function (roomName, selectedCardIndexes) {
        var room = getRoom(roomName);
        var user = getUserByRoom(room, socket.id);
        var selectedCards = indexesToCards(user, selectedCardIndexes);
        if (user && room.currentPlayer === user.name) {
            var uniqueCards = __spread(new Set(selectedCards));
            // selectedCards is sorted
            if (uniqueCards.length === 1 || uniqueCards[1] === JOKER) {
                var index = room.users.indexOf(user);
                var nextIndex = index === room.users.length - 1 ? 0 : index + 1;
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
                        var biggestWon_1 = 0;
                        var remainingPlayers_1 = -1; // current player hasn't won yet
                        room.users.forEach(function (user) {
                            biggestWon_1 = Math.max(biggestWon_1, user.won);
                            if (!user.left && user.won) {
                                remainingPlayers_1++;
                            }
                        });
                        user.won = biggestWon_1 + 1;
                        if (remainingPlayers_1 === 1) {
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
    socket.on('pass-turn', function (roomName) {
        var room = getRoom(roomName);
        var user = getUserByRoom(room, socket.id);
        if (user && room.currentPlayer === user.name && room.trickLead !== user.name) {
            var index = room.users.indexOf(user);
            var nextIndex = index === room.users.length - 1 ? 0 : index + 1;
            var reachTrickLeader = false;
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
    var roomList = rooms.map(function (room) {
        return {
            name: room.name,
            joinable: room.state === GameState.Lobby,
            playerCount: room.users.filter(function (user) { return !user.left; }).length
        };
    });
    io.emit('room-list-update', roomList);
}
function emitUserList(room) {
    var userList = room.users.map(function (user) {
        return {
            name: user.name,
            ready: user.ready,
            left: user.left,
            won: user.won,
            cardCount: user.cards.length
        };
    });
    io["in"](room.name).emit('user-list-update', userList);
}
function emitGameState(room) {
    var gameState = {
        roomName: room.name,
        state: room.state,
        currentPlayer: room.currentPlayer,
        trickLead: room.trickLead,
        currentCard: room.currentCard,
        currentCardCount: room.currentCardCount,
        revolutionTimer: room.revolutionTimer
    };
    io["in"](room.name).emit('game-state-update', gameState);
}
function emitUserState(user) {
    var userState = {
        name: user.name,
        cards: user.cards,
        taxSubmitted: user.taxSubmitted,
        taxCardIndexes: user.taxCardIndexes
    };
    io.to(user.socketID).emit('user-state-update', userState);
}
function emitAllUserState(room) {
    room.users.forEach(function (user) { return emitUserState(user); });
}
function startGame(room) {
    if (room.firstRound) {
        shuffle(room.users);
    }
    var deck = [];
    var maxCard = 0; // more sophisticated algorithm would be good
    if (room.users.length === 4)
        maxCard = 10;
    else if (room.users.length === 5)
        maxCard = 11;
    else
        maxCard = 12;
    // FOR TESTING
    //maxCard = 3
    for (var i = 1; i <= maxCard; i++) {
        for (var j = 0; j < i; j++) {
            deck.push(i);
        }
    }
    deck.push(JOKER);
    deck.push(JOKER);
    shuffle(deck);
    var perPerson = Math.floor(deck.length / room.users.length);
    var remainder = deck.length % room.users.length;
    for (var i = 0; i < room.users.length; i++) {
        room.users[i].cards = deck.splice(0, perPerson); // also replaces cards
    }
    for (var i = 0; i < remainder; i++) {
        room.users[i].cards.push(deck.splice(0, 1)[0]);
    }
    for (var i = 0; i < room.users.length; i++) {
        room.users[i].cards.sort(CARD_ORDER);
    }
    room.state = GameState.Revolution;
    room.revolutionInterval = setInterval(function () {
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
    room.users.forEach(function (user, i) {
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
    var gd = room.users[0];
    var ld = room.users[1];
    var lp = room.users[room.users.length - 2];
    var gp = room.users[room.users.length - 1];
    tradeTax(gd, gp);
    tradeTax(ld, lp);
    room.state = GameState.Play;
    room.currentPlayer = gd.name;
    room.trickLead = room.currentPlayer;
}
function tradeTax(a, b) {
    var _a, _b;
    // remove tax cards from users
    var aTaxCards = indexesToCards(a, a.taxCardIndexes);
    var bTaxCards = indexesToCards(b, b.taxCardIndexes);
    removeCards(a, aTaxCards);
    removeCards(b, bTaxCards);
    // give cards to the other
    (_a = a.cards).push.apply(_a, __spread(bTaxCards));
    (_b = b.cards).push.apply(_b, __spread(aTaxCards));
    // sort hands
    a.cards.sort(CARD_ORDER);
    b.cards.sort(CARD_ORDER);
}
function removeCards(user, cards) {
    cards.forEach(function (card) {
        user.cards.splice(user.cards.indexOf(card), 1);
    });
}
function restart(room) {
    room.users.filter(function (user) { return user.left; });
    room.users.sort(function (a, b) {
        if (a.won === 0) {
            return 1;
        }
        if (b.won === 0) {
            return -1;
        }
        return a.won - b.won;
    });
    room.users.forEach(function (user) {
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
    var roomFound = null;
    rooms.forEach(function (room) {
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
    var userFound = null;
    if (room) {
        room.users.forEach(function (user) {
            if (user.socketID === socketID) {
                userFound = user;
            }
        });
    }
    return userFound;
}
function indexesToCards(user, indexes) {
    return indexes.map(function (index) { return user.cards[index]; });
}
function shuffle(a) {
    var _a;
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = __read([a[j], a[i]], 2), a[i] = _a[0], a[j] = _a[1];
    }
    return a;
}
