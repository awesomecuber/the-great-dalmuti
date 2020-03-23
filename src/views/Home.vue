<template>
  <div class="home">
    <h3>Rooms:</h3>
    <p v-for="(room, index) in rooms" :key="index">
      <router-link :to="'room/' + room.name">{{ room.name }}</router-link> <button @click="remove(room.name)">remove!</button>
      online: {{ room.count }}
    </p>
    <form @submit.prevent="create">
      <input type="text" v-model="newRoom">
      <input type="submit" value="create room">
    </form>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'Home',
  data() {
    return {
      socket: null,
      rooms: [],
      newRoom: ''
    }
  },
  created() {
    this.socket = io(process.env.NODE_ENV === 'production'
                      ? 'https://murmuring-basin-34584.herokuapp.com'
                      : 'http://localhost:3000')
  },
  mounted() {
    this.socket.on('room-update', rooms => {
      this.rooms = rooms
    })
  },
  methods: {
    create() {
      if (this.newRoom !== '') {
        this.socket.emit('room-created', this.newRoom)
        this.newRoom = ''
      }
    },
    remove(room) {
      this.socket.emit('room-removed', room)
    }
  }
}
</script>
