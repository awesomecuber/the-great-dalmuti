<template>
  <div class="room">
    <center>
      <div class="header">
        <h1 style="margin-bottom: 0px; margin-top: 0px;">The Great Dalmuti</h1>
        <h2 style="margin: 0px;">
          Room: {{ $route.params.room
          }}<span v-if="loggedIn"> | Your Name: {{ name }}</span>
        </h2>
      </div>
      <hr />
      <div v-if="!gameStarted">
        <button @click="leave">Back to home</button>
        <p>Once everyone is ready, the game will start</p>
        <br />
        <h3>Users:</h3>
        <div v-for="(user, index) in users" :key="index">
          <p v-if="user.username === name">
            <b>{{ user.username }} </b>
            <button @click="toggleReady">
              ready: {{ ready ? 'yes' : 'no' }}
            </button>
            <button @click="remove">remove from lobby</button>
          </p>
          <p v-else>
            {{ user.username }}
            (ready: {{ user.ready ? 'yes' : 'no' }})
          </p>
        </div>
        <p v-if="users.length === 0">
          <i>(no one)</i>
        </p>
        <br />
        <form v-if="!loggedIn" @submit.prevent="nick">
          <input type="text" v-model="nickInput" />
          <input type="submit" value="login" />
        </form>
      </div>
      <div id="game" v-else>
        <play-area
          turn="BlueCrystal004"
          :currentCard="12"
          :currentCardCount="5"
          :playerCards="cards"
        />

        <br />
        <br />
        <info-area
          :lastMoves="lastMoves"
          trickLead="LordGeek101"
          :users="users"
        />
      </div>
    </center>
  </div>
</template>

<script>
import PlayArea from '../components/PlayArea.vue'
import InfoArea from '../components/InfoArea.vue'

export default {
  name: 'Room',
  data() {
    return {
      rooms: [],
      users: [], // socketID: string, username: string, ready: boolean, cards: number
      nickInput: '',
      name: '',
      cards: [],
      loggedIn: false,
      ready: false,
      gameStarted: false,
      lastMoves: [
        '<i>geek</i> played <b>five 10s</b>',
        '<i>jon</i> played <b>five 9s</b>',
        '<i>nico</i> played <b>five 8s</b>',
        '<i>frogyfro</i> played <b>five 12s</b>',
        '<i>aidan</i> <b>passed</p>'
      ]
    }
  },
  components: {
    PlayArea,
    InfoArea
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about room names
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) {
          this.users = room.users // saving users

          this.gameStarted = room.started // updating game state
        }
      })

      // checking if users no longer includes current person (server was reset in room yo)
      if (!this.users.map(user => user.username).includes(this.name)) {
        this.nickInput = ''
        this.name = ''
        this.loggedIn = false
        this.ready = false
      }

      // update cards
      this.users.forEach(user => {
        if (user.username === this.name) {
          this.cards = user.cards
        }
      })

      // checking if current room was deleted
      if (!this.rooms.includes(this.$route.params.room)) {
        this.leave()
      }
    })

    window.onbeforeunload = () => {
      if (this.loggedIn) {
        this.$socket.emit('user-left', this.$route.params.room)
      }
    }

    this.$socket.emit('request-rooms')

    this.$socket.on('socketid', socketID => {
      // if socket is already in list of rooms, be that guy (for vue reloading)
      this.users.forEach(user => {
        if (user.socketID === socketID) {
          this.name = user.username
          this.loggedIn = true
        }
      })
    })
    // i only do this because for some reason, this.$socket.id is undefined
    this.$socket.emit('request-socketid')

    this.$socket.emit('request-rooms') // megadumb
  },
  methods: {
    nick() {
      if (this.nickInput !== '' && !this.users.includes(this.nickInput)) {
        this.name = this.nickInput
        this.loggedIn = true
        this.$socket.emit('user-joined', this.$route.params.room, this.name)
      }
    },
    toggleReady() {
      this.ready = !this.ready
      this.$socket.emit('ready-toggle', this.$route.params.room, this.ready)
    },
    remove() {
      this.$socket.emit('user-left', this.$route.params.room)
    },
    leave() {
      if (this.loggedIn) {
        this.$socket.emit('user-left', this.$route.params.room)
      }
      this.$router.push('/home')
    }
  },
  watch: {
    $route(to, from) {
      // might be a problem? idk when exactly this is triggered
      if (this.loggedIn) {
        this.$socket.emit('user-left', from.params.room)
      }
      if (!this.rooms.includes(to.params.room)) {
        this.$router.push('/home')
      }
    }
  }
}
</script>

<style scoped>
p.small {
  line-height: 1.15;
}

table.played {
  border: 5px solid black;
}

table.hand {
  border: 2px solid black;
}

.cards {
  display: flex;
  justify-content: center;
  width: 70%;
}

.box {
  display: flex;
  justify-content: center;
}

.margin {
  margin: 35px;
}

body {
  background-color: whitesmoke;
  font-family: sans-serif;
}

.alignleft {
  float: left;
  text-align: left;
  width: 33.33333%;
}

.aligncenter {
  float: left;
  text-align: center;
  width: 33.33333%;
}

.alignright {
  float: left;
  text-align: right;
  width: 33.33333%;
}
</style>
