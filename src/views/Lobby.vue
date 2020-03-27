<template>
  <div>
    <p>Once everyone is ready, the game will start</p>
    <br />
    <h3>Users:</h3>
    <div v-for="(user, index) in users" :key="index">
      <p v-if="user.name === name">
        <b>{{ user.name }} </b>
        <button @click="toggleReady">ready: {{ ready ? 'yes' : 'no' }}</button>
        <button @click="remove">remove from lobby</button>
      </p>
      <p v-else>
        {{ user.name }}
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
</template>

<script>
export default {
  name: 'Lobby',
  data() {
    return {
      rooms: [],
      users: [],
      nickInput: '',
      name: '',
      cards: [],
      loggedIn: false,
      ready: false,
      gameStarted: false // used to prevent the next(false)
    }
  },
  beforeMount() {
    window.addEventListener('beforeunload', this.preventNav)
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name)
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) {
          this.users = room.users // saving users

          // check if game should start
          if (room.started) {
            this.gameStarted = true
            this.$router.push('/room/' + this.$route.params.room + '/game')
          }
        }
      })

      // checking if users no longer includes current person (server was reset in room yo)
      if (!this.users.map(user => user.name).includes(this.name)) {
        this.nickInput = ''
        this.name = ''
        this.loggedIn = false
        this.ready = false
      }

      // checking if current room was deleted
      if (!this.rooms.includes(this.$route.params.room)) {
        this.$router.push('/home')
      }
    })

    this.$socket.emit('request-rooms') // do this before so i get list of users

    this.$socket.on('socketid', socketID => {
      // if socket is already in list of rooms, be that guy (for vue reloading)
      this.users.forEach(user => {
        if (user.socketID === socketID) {
          this.name = user.name
          this.loggedIn = true
          this.$emit('name-set', this.name)
        }
      })
    })
    // i only do this because for some reason, this.$socket.id is undefined
    this.$socket.emit('request-socketid')

    this.$socket.emit('request-rooms') // megadumb

    this.$socket.on('disconnect', reason => {
      if (reason === 'io client disconnect' && !this.gameStarted) {
        this.$socket.emit('user-left', this.$route.params.room)
      }
    })
  },
  methods: {
    nick() {
      if (
        this.nickInput !== '' &&
        !this.users.map(user => user.name).includes(this.nickInput)
      ) {
        this.name = this.nickInput
        this.loggedIn = true
        this.$emit('name-set', this.name)
        this.$socket.emit('user-joined', this.$route.params.room, this.name)
      }
    },
    toggleReady() {
      this.ready = !this.ready
      this.$socket.emit('ready-toggle', this.$route.params.room, this.ready)
    },
    remove() {
      this.$emit('name-set', '')
      this.$socket.emit('user-left', this.$route.params.room)
    }
  },
  beforeRouteLeave(to, from, next) {
    if (to.path === '/home') {
      this.$socket.emit('user-left', this.$route.params.room)
      next()
    } else if (this.gameStarted) {
      next()
    } else {
      next(false)
    }
  }
}
</script>

<style></style>
