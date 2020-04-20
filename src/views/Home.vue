<template>
  <div class="home">
    <center>
      <h3>Rooms:</h3>
      <div class="room" v-for="(room, index) in rooms" :key="index">
        <button :disabled="!room.joinable" @click="join(room.name)">
          {{ room.name }}
          <span v-if="!room.joinable"> (started)</span>
        </button>
        <button @click="remove(room.name)">remove!</button>
        <p>online: {{ room.playerCount }}</p>
      </div>
      <form @submit.prevent="create">
        <input type="text" v-model="newRoom" />
        <input type="submit" value="create room" />
      </form>
    </center>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Home',
  data() {
    return {
      newRoom: ''
    }
  },
  computed: mapState(['rooms']),
  methods: {
    create() {
      if (this.newRoom !== '') {
        this.$socket.emit('create-room', this.newRoom)
        this.newRoom = ''
      }
    },
    join(room) {
      this.$socket.emit('enter-room', room)
      this.$router.push('/room/' + room + '/lobby')
    },
    remove(room) {
      this.$socket.emit('remove-room', room)
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
