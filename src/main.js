import Vue from 'vue'
import App from './App.vue'
import router from './router'
import io from 'socket.io-client'

Vue.config.productionTip = false
Vue.prototype.$socket = io(process.env.NODE_ENV === 'production'
                            ? 'fuckmyass.com'
                            : 'http://localhost:3000')
Vue.prototype.$word = "arst"

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
