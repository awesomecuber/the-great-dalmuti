import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Room from '../views/Room.vue'
import Lobby from '../views/Lobby.vue'
import Game from '../views/Game.vue'

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject)
    return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/room/:room',
    component: Room,
    children: [
      {
        path: 'lobby',
        name: 'Lobby',
        component: Lobby
      },
      {
        path: 'game',
        name: 'Game',
        component: Game
      }
    ]
  },
  {
    path: '*',
    redirect: { name: 'Home' }
  }
]

const router = new VueRouter({
  routes
})

export default router
