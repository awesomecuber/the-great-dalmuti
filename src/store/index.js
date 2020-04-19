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
    SET_ROOM_LIST(state, roomList) {
      state.roomList = roomList
    },
    SET_USER_LIST(state, userList) {
      state.userList = userList
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
    SET_REVOLUTION_TIME(state, revolutionTime) {
      state.gameState.revolutionTime = revolutionTime
    },
    SET_CARDS(state, cards) {
      state.userState.cards = cards
    },
    SET_TAX_INFO(state, taxInfo) {
      state.userState.taxSubmitted = taxInfo.taxSubmitted
      state.userState.taxCards = taxInfo.taxCards
    }
  },
  actions: {
    updateRoomList({ commit }, roomList) {
      commit('SET_ROOM_LIST', roomList)
    },
    updateUserList({ commit }, userList) {
      commit('SET_USER_LIST', userList)
    },
    updateGameState({ commit, state }, gameState) {
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
      if (state.gameState.revolutionTime !== gameState.revolutionTime) {
        commit('SET_REVOLUTION_TIME', gameState.revolutionTime)
      }
    },
    updateUserState({ commit, state }, userState) {
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
      if (
        state.userState.taxSubmitted !== userState.taxSubmitted ||
        state.userState.taxCards !== userState.taxCards
      ) {
        commit('SET_TAX_INFO', {
          taxSubmitted: userState.taxSubmitted,
          taxCards: userState.taxCards
        })
      }
    }
  },
  modules: {}
})
