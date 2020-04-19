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

Vue.prototype.$socket = socket

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
