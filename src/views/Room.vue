<template>
  <div class="room">
    <button @click="leave">Back to home</button>
    <h1>Room: {{ $route.params.room }}</h1>
    <p v-for="(user, index) in users" :key="index">{{ user === name ? user + ' (you!)' : user }}</p>
    <form v-if="!loggedIn" @submit.prevent="nick">
      <input type="text" v-model="nickInput">
      <input type="submit" value="login">
    </form>
  </div>
</template>

<script>
export default {
  name: 'Room',
  data() {
    return {
      rooms: [],
      users: [],
      nickInput: '',
      name: '',
      loggedIn: false
    }
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about names
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) this.users = room.users
      })
      // checking if current room was deleted
      if (!this.rooms.includes(this.$route.params.room)) {
        this.leave()
      }
    })

    window.onbeforeunload = () => {
      this.$socket.emit('user-left', this.$route.params.room)
    }

    this.$socket.emit('request-rooms')
  },
  methods: {
    nick() {
      if (this.nickInput !== '') {
        this.name = this.nickInput
        this.loggedIn = true
        this.$socket.emit('user-joined', this.$route.params.room, this.name)
      }
    },
    leave() {
      if (this.loggedIn) {
        this.$socket.emit('user-left', this.$route.params.room, this.name)
      }
      this.$router.push('/home')
    }
  },
  watch: {
    $route(to, from) { // might be a problem? idk when exactly this is triggered
      if (this.loggedIn) {
        this.$socket.emit('user-left', from.params.room, this.name)
      }
      if (!this.rooms.includes(to.params.room)) {
        this.$router.push('/home')
      }
    }
  }
}
</script>