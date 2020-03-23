<template>
  <div class="room">
    <button @click="leave">Back to home</button>
    <h1>Room: {{ $route.params.room }}</h1>
    <p v-for="(message, index) in messages" :key="index" v-html="message"></p>
    <form @submit.prevent="send">
      <input type="text" v-model="message">
      <input type="submit" value="send">
    </form>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'Room',
  data() {
    return {
      socket: null,
      rooms: [],
      messages: [],
      message: ''
    }
  },
  created() {
    this.socket = io(process.env.NODE_ENV === 'production'
                      ? 'https://murmuring-basin-34584.herokuapp.com'
                      : 'http://localhost:3000')
  },
  mounted() {
    this.socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about names
      // checking if current room was deleted
      if (!this.rooms.includes(this.$route.params.room)) {
        this.leave()
      }
    })
    
    this.socket.on('new-message', message => {
      this.messages.push('<b>someone:</b> ' + message)
    })

    this.socket.on('user-join', () => {
      this.messages.push('<b>someone joined</b>')
    })

    this.socket.on('user-leave', () => {
      this.messages.push('<b>someone left</b>')
    })

    this.socket.emit('user-joined', this.$route.params.room)

    window.onbeforeunload = () => {
      this.socket.emit('user-left', this.$route.params.room)
    }
  },
  methods: {
    send() {
      if (this.message != '') {
        this.messages.push('<b>you: </b>' + this.message)
        this.socket.emit('message-sent', this.$route.params.room, this.message)
        this.message = ''
      }
    },
    leave() {
      this.socket.emit('user-left', this.$route.params.room)
      this.$router.push('/home')
    }
  },
  watch: {
    $route(to, from) { // might be a problem? idk when exactly this is triggered
      this.socket.emit('user-left', from.params.room)
      if (this.rooms.includes(to.params.room)) {
        this.socket.emit('user-joined', to.params.room)
        this.messages = []
      } else {
        this.$router.push('/home')
      }
    }
  }
}
</script>