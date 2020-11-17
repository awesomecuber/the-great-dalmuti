import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueSocketIO from 'vue-socket.io'
import io from 'socket.io-client'
import store from './store'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import './main.scss'

Vue.config.productionTip = false

let socket = io(
  process.env.NODE_ENV === 'production'
    ? 'https://great-dalmuti-socket.herokuapp.com/'
    : 'http://localhost:3000'
)

Vue.use(
  new VueSocketIO({
    connection: socket
  })
)

Vue.use(Buefy)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
