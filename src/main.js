import Vue from 'vue'
import App from './App.vue'
import router from './router'
import io from 'socket.io-client'

Vue.config.productionTip = false
let socket = io(
  process.env.NODE_ENV === 'production'
    ? 'fuckmyass.com'
    : 'http://localhost:3560'
)

Vue.prototype.$socket = socket

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
