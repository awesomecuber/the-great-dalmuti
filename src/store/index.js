import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    roomList: [],
    userList: [],
    gameState: {
      state: '',
      currentPlayer: '',
      trickLead: '',
      currentCard: 0,
      currentCardCount: 0,
      revolutionTime: 0
    },
    userState: {
      cards: [],
      taxSubmitted: false,
      taxCards: []
    }
  },
  mutations: {
  },
  actions: {
    updateRoomList() {},
    updateUserList() {},
    updateGameState() {},
    updateUserState() {}
  },
  modules: {
  }
})
