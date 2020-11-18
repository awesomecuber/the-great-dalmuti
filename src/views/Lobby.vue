<template>
  <div class="column is-one-third">
    <div class="box">
      <h2 class="title">
        Users in "<i>{{ $route.params.room }}</i
        >"
      </h2>
      <table class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th align="center">Player</th>
            <th align="center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in users" :key="index">
            <th align="center">{{ user.name }}</th>
            <td v-if="user.name === userState.name" align="center">
              <b-button v-if="user.ready" @click="toggleReady" type="is-success">Ready!</b-button>
              <b-button v-else @click="toggleReady" type="is-danger">Waiting</b-button>
            </td>
            <td v-else align="center">
              <b-button disabled v-if="user.ready" type="is-success">Ready!</b-button>
              <b-button disabled v-else type="is-danger">Waiting</b-button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="users.length === 0">
        <i>It's lonely in here...</i>
      </p>
      <br />
      <div class="field has-addons has-addons-centered" v-if="!loggedIn">
        <div class="control">
          <input
            class="input is-primary"
            type="text"
            placeholder="Enter your name"
            v-model="nickInput"
          />
        </div>
        <div class="control">
          <a class="button is-info" @click="nick"> Join </a>
        </div>
      </div>
    </div>
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
