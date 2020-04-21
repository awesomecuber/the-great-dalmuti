<template>
  <div id="game">
    <p id="display" v-html="displayText"></p>
    <br />
    <card-area
      @card-select-change="cardSelectChange"
    />
    <div>
      <button
        @click="mainButtonClick"
        :disabled="this.mainButtonDisabled"
        :style="{ color: this.mainButtonDisabled ? 'gainsboro' : 'black' }"
      >
        <h1 class="text-margin">
          {{ mainButtonText }}
        </h1>
      </button>
      <button
        @click="passButtonClick"
        :disabled="this.passButtonDisabled"
        :style="{ color: this.passButtonDisabled ? 'gainsboro' : 'black' }"
      >
        <h1 class="text-margin">Pass</h1>
      </button>
    </div>

    <br />
    <br />
    <info-area :lastMoves="lastMoves" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import CardArea from '../components/CardArea.vue'
import InfoArea from '../components/InfoArea.vue'

export default {
  name: 'Game',
  components: {
    CardArea,
    InfoArea
  },
  data() {
    return {
      selectedCardIndexes: [],
      lastMoves: [
        '<i>geek</i> played <b>five 10s</b>',
        '<i>jon</i> played <b>five 9s</b>',
        '<i>nico</i> played <b>five 8s</b>',
        '<i>frogyfro</i> played <b>five 12s</b>',
        '<i>aidan</i> <b>passed</p>'
      ],
      gameEnded: false
    }
  },
  computed: {
    playerRole: function() {
      let rank = this.users.map(user => user.name).indexOf(this.userState.name)
      if (rank === 0) {
        return 'GD'
      } else if (rank === 1) {
        return 'LD'
      } else if (rank === this.users.length - 2) {
        return 'LP'
      } else if (rank === this.users.length - 1) {
        return 'GP'
      } else {
        return 'M'
      }
    },
    displayText: function() {
      switch (this.gameState.state) {
        case 'REVOLUTION':
          return `Revolution Stage (${this.gameState.revolutionTimer}s left): If you have two jokers, you can declare a revolution!`
        case 'TAX':
          if (this.playerRole === 'GD') {
            return `Tax stage: Pick 2 cards to give to ${
              this.users[this.users.length - 1].name
            }`
          } else if (this.playerRole === 'LD') {
            return `Tax stage: Pick 1 card to give to ${
              this.users[this.users.length - 2].name
            }`
          } else if (this.playerRole === 'LP') {
            return `Tax stage: Your lowest card will be given to ${this.users[1].name}`
          } else if (this.playerRole === 'GP') {
            return `Tax stage: Your 2 lowest cards will be given to ${this.users[0].name}`
          } else {
            // merchant
            return 'Tax stage: Sit tight while others trade!'
          }
        case 'PLAY':
          return `It is <b>${this.gameState.currentPlayer}</b>'s turn.`
      }
      return 'UHHH'
    },
    mainButtonText: function() {
      switch (this.gameState.state) {
        case 'REVOLUTION':
          return this.playerRole === 'GP' ? 'Greater Revolution' : 'Revolution'
        case 'TAX':
          return 'Trade'
        case 'PLAY':
          return 'Play'
      }
      return 'UHHH'
    },
    mainButtonDisabled: function() {
      switch (this.gameState.state) {
        case 'REVOLUTION':
          var numJokers = 0
          this.userState.cards.forEach(card => {
            if (card === 99) {
              numJokers++
            }
          })
          return numJokers !== 2
        case 'TAX':
          return this.userState.taxSubmitted
        case 'PLAY':
          return this.gameState.currentPlayer !== this.userState.name
      }
      return false
    },
    passButtonDisabled: function() {
      if (this.gameState.state === 'PLAY' && this.currentCard !== 0) {
        return this.gameState.currentPlayer !== this.userState.name
      }
      return true
    },
    mandatoryTax: function() {
      if (this.gameState.state !== 'TAX') {
        return 0
      } else {
        if (this.playerRole === 'GP') {
          return 2
        } else if (this.playerRole === 'LP') {
          return 1
        } else {
          return 0
        }
      }
    },
    ...mapState(['users', 'gameState', 'userState']),
    state: function() {
      return this.gameState.state
    },
    roomName: function() {
      return this.gameState.roomName
    } // need to watch roomList in general
    // also, might as well move it to Room.vue
  },
  watch: {
    state: function(newState) {
      if (newState === 'LOBBY') {
        this.gameEnded = true
        this.$router.push('/room/' + this.$route.params.room + '/lobby')
      }
    },
    roomName: function(newName) {
      if (newName === '') {
        this.$router.push('/home')
      }
    }
  },
  methods: {
    mainButtonClick() {
      switch (this.gameState.state) {
        case 'REVOLUTION':
          this.$socket.emit('call-revolution', this.$route.params.room)
          return
        case 'TAX':
          this.$socket.emit(
            'select-tax',
            this.$route.params.room,
            this.selectedCardIndexes
          )
          return
        case 'PLAY':
          this.$socket.emit('play-hand', this.$route.params.room, this.selectedCardIndexes)
          return
      }
    },
    passButtonClick() {
      this.$socket.emit('pass-turn', this.$route.params.room)
    },
    cardSelectChange(selectedCardIndexes) {
      this.selectedCardIndexes = selectedCardIndexes
    }
  },
  beforeRouteLeave(to, from, next) {
    if (to.path === '/home') {
      this.$socket.emit('user-left', this.$route.params.room)
      next()
    } else if (this.gameEnded) {
      next()
    } else {
      next(false)
    }
  }
}
</script>

<style></style>
