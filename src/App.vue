<template>
  <div id="app">
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
  }
}
</script>
