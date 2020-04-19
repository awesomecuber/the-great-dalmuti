import Vue from 'vue'
import App from './App.vue'
import router from './router'
import io from 'socket.io-client'
import store from './store'

Vue.config.productionTip = false

let socket = io(
  process.env.NODE_ENV === 'production'
    ? 'doesntexistyet.com'
    : 'http://localhost:3000'
)

socket.on('room-list-update', roomList => store.dispatch('updateRoomList', { roomList }))
socket.on('user-list-update', userList => store.dispatch('updateUserList', { userList }))
socket.on('game-state-update', gameState => store.dispatch('updateGameState', { gameState }))
socket.on('user-state-update', userState => store.dispatch('updateUserState', { userState }))
socket.on('disconnect', reason => {
  if (reason === 'io client disconnect') {
    this.$socket.emit('user-left', this.$route.params.room)
  }
})
socket.on('connect', () => {
  // store.dispatch('attemptReconnect', { id: socket.id })
})

Vue.prototype.$socket = socket

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
