<template>
  <div id="app">
    <b-navbar class="is-light">
        <template slot="brand">
            <b-navbar-item href="https://en.wikipedia.org/wiki/The_Great_Dalmuti" target="_blank">
                <img src="great_dalmuti_logo_0.png">
            </b-navbar-item>
        </template>
        <template slot="start">
            <b-navbar-item @click="leave">
                Home
            </b-navbar-item>
            <b-navbar-item href="https://media.wizards.com/2015/downloads/ah/great_dalmuti_rules.pdf" target="_blank">
                Rules
            </b-navbar-item>
            <b-navbar-dropdown label="More">
                <b-navbar-item href="https://github.com/awesomecuber/the-great-dalmuti/issues" target="_blank">
                    Report an issue
                </b-navbar-item>
            </b-navbar-dropdown>
        </template>
        <template slot="end">
            <b-navbar-item tag="div">
                <div class="buttons">
                    <a class="button is-primary is-rounded" href="https://github.com/awesomecuber/the-great-dalmuti" target="_blank">
                      <span class="icon">
                        <i class="fab fa-github"></i>
                        </span>
                      <strong>GitHub</strong>
                    </a>
                </div>
            </b-navbar-item>
        </template>
    </b-navbar>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  sockets: {
    roomListUpdate: function(roomList) {
      this.$store.dispatch('updateRoomList', roomList)
    },
    userListUpdate: function(userList) {
      this.$store.dispatch('updateUserList', userList)
    },
    gameStateUpdate: function(gameState) {
      this.$store.dispatch('updateGameState', gameState)
    },
    userStateUpdate: function(userState) {
      this.$store.dispatch('updateUserState', userState)
    },
    disconnect: function(reason) {
      if (reason === 'io client disconnect') {
        this.$socket.emit('user-left', this.$route.params.room)
      }
    }
  },
  methods: {
    leave() {
      this.$socket.emit('leave-room', this.$route.params.room)
      this.$store.dispatch('resetState')
      this.$router.push('/home')
    }
  }
}
</script>

<style>

</style>
