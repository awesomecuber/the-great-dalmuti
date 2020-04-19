<template>
  <div class="home">
    <center>
      <h3>Rooms:</h3>
      <div class="room" v-for="(room, index) in roomList" :key="index">
        <button :disabled="room.state !== 'LOBBY'" @click="join(room.name)">
          {{ room.name }}
          <span v-if="room.state !== 'LOBBY'"> (started)</span>
        </button>
        <button @click="remove(room.name)">remove!</button>
        <p>online: {{ roomList.playerCount }}</p>
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
  computed: mapState(['roomList']),
  methods: {
    create() {
      if (this.newRoom !== '') {
        this.$socket.emit('create-room', this.newRoom)
        this.newRoom = ''
      }
    },
    join(room) {
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
