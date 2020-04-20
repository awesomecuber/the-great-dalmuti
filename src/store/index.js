import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    rooms: [],
    users: [],
    gameState: {
      roomName: '',
      state: '',
      currentPlayer: '',
      trickLead: '',
      currentCard: 0,
      currentCardCount: 0,
      revolutionTimer: 0
    },
    userState: {
      name: '',
      cards: [],
      taxSubmitted: false,
      taxCardIndexes: []
    }
  },
  mutations: {
    SET_ROOM_LIST(state, roomList) {
      state.rooms = roomList
    },
    SET_USER_LIST(state, userList) {
      state.users = userList
    },
    SET_ROOM_NAME(state, roomName) {
      state.gameState.roomName = roomName
    },
    SET_GAME_PHASE(state, phase) {
      state.gameState.state = phase
    },
    SET_CURRENT_PLAYER(state, currentPlayer) {
      state.gameState.currentPlayer = currentPlayer
    },
    SET_TRICK_LEAD(state, trickLead) {
      state.gameState.trickLead = trickLead
    },
    SET_CURRENT_CARD(state, currentCard) {
      state.gameState.currentCard = currentCard
    },
    SET_CURRENT_CARD_COUNT(state, currentCardCount) {
      state.gameState.currentCardCount = currentCardCount
    },
    SET_REVOLUTION_TIMER(state, revolutionTimer) {
      state.gameState.revolutionTimer = revolutionTimer
    },
    SET_NAME(state, name) {
      state.userState.name = name
    },
    SET_CARDS(state, cards) {
      state.userState.cards = cards
    },
    SET_TAX_INFO(state, taxInfo) {
      state.userState.taxSubmitted = taxInfo.taxSubmitted
      state.userState.taxCardIndexes = taxInfo.taxCardIndexes
    },
    RESET_USER_LIST(state) {
      state.users = []
    },
    RESET_GAME_STATE(state) {
      state.gameState.roomName = ''
      state.gameState.state = ''
      state.gameState.currentPlayer = ''
      state.gameState.trickLead = ''
      state.gameState.currentCard = 0
      state.gameState.currentCardCount = 0
      state.gameState.revolutionTimer = 0
    },
    RESET_USER_STATE(state) {
      state.userState.name = ''
      state.userState.cards = []
      state.userState.taxSubmitted = false
      state.userState.taxCardIndexes = []
    }
  },
  actions: {
    updateRoomList({ commit, state }, roomList) {
      commit('SET_ROOM_LIST', roomList)
      if (state.gameState.roomName !== '' && !roomList.map(room => room.name).includes(state.gameState.roomName)) {
        // room deleted
        commit('RESET_USER_LIST')
        commit('RESET_GAME_STATE')
        commit('RESET_USER_STATE')
      }
    },
    updateUserList({ commit, state }, userList) {
      commit('SET_USER_LIST', userList)
      if (state.userState.name !== '' && !userList.map(user => user.name).includes(state.userState.name)) {
        // user removed
        commit('RESET_USER_LIST')
        commit('RESET_GAME_STATE')
        commit('RESET_USER_STATE')
      }
    },
    updateGameState({ commit, state }, gameState) {
      if (state.gameState.roomName !== gameState.roomName) {
        commit('SET_ROOM_NAME', gameState.roomName)
      }
      if (state.gameState.state !== gameState.state) {
        commit('SET_GAME_PHASE', gameState.state)
      }
      if (state.gameState.currentPlayer !== gameState.currentPlayer) {
        commit('SET_CURRENT_PLAYER', gameState.currentPlayer)
      }
      if (state.gameState.trickLead !== gameState.trickLead) {
        commit('SET_TRICK_LEAD', gameState.trickLead)
      }
      if (state.gameState.currentCard !== gameState.currentCard) {
        commit('SET_CURRENT_CARD', gameState.currentCard)
      }
      if (state.gameState.currentCardCount !== gameState.currentCardCount) {
        commit('SET_CURRENT_CARD_COUNT', gameState.currentCardCount)
      }
      if (state.gameState.revolutionTimer !== gameState.revolutionTimer) {
        commit('SET_REVOLUTION_TIMER', gameState.revolutionTimer)
      }
    },
    updateUserState({ commit, state }, userState) {
      if (userState.name !== state.userState.name) {
        commit('SET_NAME', userState.name)
      }
      let oldCards = state.userState.cards
      let newCards = userState.cards
      let equal = true
      if (oldCards.length !== newCards.length) {
        equal = false
      } else {
        oldCards.forEach((oldCard, i) => {
          if (oldCard !== newCards[i]) {
            equal = false
          }
        })
      }
      if (!equal) {
        commit('SET_CARDS', userState.cards)
      }
      if (state.userState.taxSubmitted !== userState.taxSubmitted) {
        commit('SET_TAX_INFO', {
          taxSubmitted: userState.taxSubmitted,
          taxCardIndexes: userState.taxCardIndexes
        })
      }
    },
    resetState({ commit }) {
      commit('RESET_USER_LIST')
      commit('RESET_GAME_STATE')
      commit('RESET_USER_STATE')
    }
  }
})
