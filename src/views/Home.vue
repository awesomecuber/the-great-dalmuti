<template>
  <div class="home">
    <center>
      <h3>Rooms:</h3>
      <div class="room" v-for="(room, index) in rooms" :key="index">
        <button :disabled="room.started" @click="join(room.name)">
          {{ room.name }}
          <span v-if="room.started"> (started)</span>
        </button>
        <button @click="remove(room.name)">remove!</button>
        <p>online: {{ room.users.length }}</p>
      </div>
      <form @submit.prevent="create">
        <input type="text" v-model="newRoom" />
        <input type="submit" value="create room" />
      </form>
    </center>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      rooms: [],
      newRoom: ''
    }
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms
    })

    this.$socket.emit('request-rooms')
  },
  methods: {
    create() {
      if (this.newRoom !== '') {
        this.$socket.emit('room-created', this.newRoom)
        this.newRoom = ''
      }
    },
    join(room) {
      this.$router.push('/room/' + room + '/lobby')
    },
    remove(room) {
      this.$socket.emit('room-removed', room)
    }
  }
}
</script>

<style scoped>
.room {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
