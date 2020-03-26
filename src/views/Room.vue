<template>
  <div class="room">
    <center>
      <h1 style="margin-bottom: 0px; margin-top: 0px;">The Great Dalmuti</h1>
      <h2 style="margin: 0px;">
        Room: {{ $route.params.room
        }}<span v-if="loggedIn"> | Your Name: {{ name }}</span>
      </h2>
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
      <div v-else>
        <p style="font-size: 20px; margin: 5px 0px;">
          It is <b>BlueCrystal004</b>'s turn.
        </p>
        <br />
        <table class="hand">
          <tr>
            <td>
              <Card :number="12" :large="true"></Card>
            </td>
          </tr>
          <tr>
            <td>
              <center>
                <p style="font-size: 20px; margin: 5px 0px;">x5</p>
              </center>
            </td>
          </tr>
        </table>

        <h3>Your hand:</h3>
        <div class="cards">
          <Card v-for="(card, index) in cards" :key="index" :number="card" />
        </div>

        <br />
        <br />
        <table class="played">
          <td>
            <div class="box">
              <div class="margin">
                <p><b>Last 5 moves:</b></p>
                <table>
                  <tr>
                    <td><b>1. </b></td>
                    <td><i>geek</i> played <b>five 10s</b></td>
                  </tr>
                  <tr>
                    <td><b>2. </b></td>
                    <td><i>jon</i> played <b>five 9s</b></td>
                  </tr>
                  <tr>
                    <td><b>3. </b></td>
                    <td><i>nico</i> played <b>five 8s</b></td>
                  </tr>
                  <tr>
                    <td><b>4. </b></td>
                    <td><i>frogyfro</i> played <b>[five 12s]</b></td>
                  </tr>
                  <tr>
                    <td><b>5. </b></td>
                    <td><i>aidan</i> <b>passed</b></td>
                  </tr>
                </table>

                <p><b>This trick led by</b>: LordGeek101</p>
              </div>
              <div class="margin">
                <p><b>Standings:</b></p>
                <p>
                  <span v-for="(user, index) in users" :key="index">
                    <b>{{ index + 1 }}. </b><tt>{{ getRole(index) }}</tt>
                    {{ user.username }} [<b>{{ user.cards.length }}</b
                    >] <i v-if="user.left"> (user left)</i><br />
                  </span>
                </p>
              </div>
            </div>
          </td>
        </table>
      </div>
    </center>
  </div>
</template>

<script>
import Card from '../components/Card.vue'

export default {
  name: 'Room',
  data() {
    return {
      rooms: [],
      users: [], // socketID: string, username: string, ready: boolean, cards: string (i think)
      nickInput: '',
      name: '',
      cards: [],
      loggedIn: false,
      ready: false,
      gameStarted: false
    }
  },
  components: {
    Card
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
    getRole(index) {
      if (index === 0) {
        return 'GD'
      } else if (index === 1) {
        return 'LD'
      } else if (index === this.users.length - 2) {
        return 'LP'
      } else if (index === this.users.length - 1) {
        return 'GP'
      } else {
        return 'M'
      }
    },
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
