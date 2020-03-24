<template>
  <div class="room">
    <center>
      <h1 style="margin-bottom: 0px;">The Great Dalmuti</h1>
      <h2 style="margin: 0px;">Room: {{ $route.params.room }}</h2>
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
              <table class="played">
                <tr>
                  <td class="card" style="background-color: indianred;">
                    <h1>12</h1>
                  </td>
                </tr>
              </table>
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
        <table class="played">
          <tr>
            <td class="card" style="background-color: gold;">1</td>
            <td class="card" style="background-color: aqua;">2</td>
            <td class="card" style="background-color: lime;">4</td>
            <td class="card" style="background-color: lime;">4</td>
            <td class="card" style="background-color: pink;">7</td>
            <td class="card" style="background-color: royalblue;">9</td>
            <td class="card" style="background-color: indianred;">12</td>
            <td class="card" style="background-color: indianred;">12</td>
            <td class="card" style="background-color: indianred;">12</td>
            <td class="card" style="background-color: indianred;">12</td>
          </tr>
        </table>

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
                  <b>1. </b><tt>GD</tt> Nico [<b>10</b>] <br />
                  <b>2. </b><tt>LD</tt> frogyfro [<b>10</b>] <br />
                  <b>3. </b><tt>M</tt> Shadow [<b>10</b>] <br />
                  <b>4. </b><tt>M</tt> Illumina [<b>10</b>] <br />
                  <b>5. </b><tt>M</tt> LordGeek101 [<b>10</b>] <br />
                  <b>6. </b><tt>M</tt> dtm [<b>10</b>] <br />
                  <b>7. </b><tt>LP</tt> BlueCrystal004 [<b>10</b>] <br />
                  <b>8. </b><tt>GP</tt> aidanbh123 [<b>10</b>]
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
export default {
  name: 'Room',
  data() {
    return {
      rooms: [],
      users: [], // socketID: string, username: string, ready: boolean
      nickInput: '',
      name: '',
      loggedIn: false,
      ready: false,
      gameStarted: false
    }
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about room names
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) {
          this.users = room.users // saving users

          // checking if users no longer includes current person (server was reset in room yo)
          if (!this.users.map(user => user.username).includes(this.name)) {
            this.nickInput = ''
            this.name = ''
            this.loggedIn = false
            this.ready = false
          }

          // check if start
          if (this.users.length >= 4) {
            let shouldStart = true
            this.users
              .map(user => user.ready)
              .forEach(ready => {
                if (!ready) {
                  shouldStart = false
                }
              })
            if (shouldStart) {
              // i need to emit something
              this.gameStarted = true
            }
          }
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

th.card,
td.card {
  padding: 15px;
  border: 2px solid black;
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
