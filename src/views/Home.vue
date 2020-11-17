<template>
  <div class="home">
    <center>
      <div class="column is-one-third">
        <div class="box">
          <h1 class="title">The Great Dalmuti</h1>
          <template class="roomtable" v-if="rooms.length !== 0">
            <h2 class="subtitle">Active rooms:</h2>
            <table class="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th align="center">Room</th>
                  <th align="center">Name</th>
                  <th align="center">Delete</th>
                  <th align="center">Players</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(room, index) in rooms" :key="index">
                  <th align="center">#{{ index + 1 }}</th>
                  <td align="center">
                    <button class="button is-success is-small" :disabled="!room.joinable" @click="join(room.name)">
                    {{ room.name }}
                    <span v-if="!room.joinable"> (In Progress)</span>
                    </button>
                  </td>
                  <td align="center">
                    <button class="delete" @click="remove(room.name)">Delete room</button>
                  </td>
                  <td align="center">
                    <p>{{ room.playerCount }}</p>
                  </td>   
                </tr>
              </tbody>
            </table>
          </template>
          <h1 class="subtitle">Open a new room:</h1>
          <div class="field has-addons has-addons-centered">
            <div class="control">
              <input class="input is-primary" type="text" placeholder="Room name" v-model="newRoom" />
            </div>
            <div class="control">
              <a class="button is-info" @click="create">
                Create
              </a>
            </div>
          </div>
        </div>
      </div>
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
