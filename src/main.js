import Vue from 'vue'
import App from './App.vue'
import router from './router'
import io from 'socket.io-client'
import store from './store'

Vue.config.productionTip = false

let socket = io(
  process.env.NODE_ENV === 'production'
    ? 'fuckmyass.com'
    : 'http://localhost:3000'
)

socket.on('room-list-update', roomList => store.dispatch('updateRoomList', { roomList }))
socket.on('user-list-update', userList => store.dispatch('updateUserList', { userList }))
socket.on('game-state-update', gameState => store.dispatch('updateGameState', { gameState }))
socket.on('user-state-update', userState => store.dispatch('updateUserState', { userState }))

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
