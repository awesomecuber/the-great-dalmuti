<template>
  <div class="box">
    <h2 class="title">User List</h2>
    <div v-for="(user, index) in users" :key="index">
      <p v-if="user.name === userState.name">
        <b>{{ user.name }} </b>
        <button @click="toggleReady">ready: {{ ready ? 'yes' : 'no' }}</button>
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
import { mapState } from 'vuex'

export default {
  name: 'Lobby',
  data() {
    return {
      nickInput: '',
      gameStarted: false, // used to prevent the next(false)
    }
  },
  computed: {
    ...mapState(['rooms', 'users', 'gameState', 'userState']),
    state: function () {
      return this.gameState.state
    },
    roomName: function () {
      return this.gameState.roomName
    },
    loggedIn: function () {
      return this.userState.name !== ''
    },
    ready: function () {
      let index = this.users
        .map((user) => user.name)
        .indexOf(this.userState.name)
      if (index === -1) {
        return false
      } else {
        return this.users[index].ready
      }
    },
  },
  watch: {
    state: function (newState) {
      if (newState !== 'LOBBY') {
        this.gameStarted = true
        this.$router.push('/room/' + this.$route.params.room + '/game')
      }
    },
    roomName: function (newName) {
      if (newName === '') {
        this.$router.push('/home')
      }
    },
  },
  methods: {
    nick() {
      if (
        this.nickInput !== '' &&
        !this.users.map((user) => user.name).includes(this.nickInput)
      ) {
        this.$socket.emit('join-room', this.$route.params.room, this.nickInput)
      }
    },
    toggleReady() {
      this.$socket.emit('toggle-ready', this.$route.params.room, !this.ready)
      // might not need to pass ready as a parameter...
    },
    remove() {
      this.$socket.emit('quit-room', this.$route.params.room)
    },
  },
  beforeRouteLeave(to, from, next) {
    if (to.path === '/home') {
      this.$socket.emit('leave-room', this.$route.params.room)
      next()
    } else if (this.gameStarted) {
      next()
    } else {
      next(false)
    }
  },
}
</script>

<style scoped></style>
