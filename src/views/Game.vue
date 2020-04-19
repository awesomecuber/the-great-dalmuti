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
import CardArea from '../components/CardArea.vue'
import InfoArea from '../components/InfoArea.vue'
import { mapState } from 'vuex'

export default {
  name: 'Game',
  components: {
    CardArea,
    InfoArea
  },
  data() {
    return {
      selectedCards: [],
      lastMoves: [
        '<i>geek</i> played <b>five 10s</b>',
        '<i>jon</i> played <b>five 9s</b>',
        '<i>nico</i> played <b>five 8s</b>',
        '<i>frogyfro</i> played <b>five 12s</b>',
        '<i>aidan</i> <b>passed</p>'
      ]
    }
  },
  computed: {
    playerRole: function() {
      let rank = this.userList.map(user => user.name).indexOf(this.userState.name)
      if (rank === 0) {
        return 'GD'
      } else if (rank === 1) {
        return 'LD'
      } else if (rank === this.userList.length - 2) {
        return 'LP'
      } else if (rank === this.userList.length - 1) {
        return 'GP'
      } else {
        return 'M'
      }
    },
    displayText: function() {
      switch (this.gameState.state) {
        case 'REVOLUTION':
          return `Revolution Stage (${this.gameState.revolutionTime}s left): If you have two jokers, you can declare a revolution!`
        case 'TAX':
          if (this.playerRole === 'GD') {
            return `Tax stage: Pick 2 cards to give to ${
              this.userList[this.userList.length - 1].name
            }`
          } else if (this.playerRole === 'LD') {
            return `Tax stage: Pick 1 card to give to ${
              this.userList[this.userList.length - 2].name
            }`
          } else if (this.playerRole === 'LP') {
            return `Tax stage: Your lowest card will be given to ${this.userList[1].name}`
          } else if (this.playerRole === 'GP') {
            return `Tax stage: Your 2 lowest cards will be given to ${this.userList[0].name}`
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
      switch (this.gameState) {
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
      switch (this.gameState) {
        case 'REVOLUTION':
          var numJokers = 0
          this.cards.forEach(card => {
            if (card === 99) {
              numJokers++
            }
          })
          return numJokers !== 2
        case 'TAX':
          if (
            this.playerRole === 'M' ||
            this.playerRole === 'LP' ||
            this.playerRole === 'GP'
          ) {
            return true
          }
          return this.usersState.taxSubmitted
        case 'PLAY':
          return this.gameState.currentPlaye === this.userState.name
      }
      return false
    },
    passButtonDisabled: function() {
      if (this.gameState.state === 'PLAY' && this.currentCard !== 0) {
        return false
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
    // taxSubmitted: function() {
    //   let index = this.userList.map(user => user.name).indexOf(this.userState.name)
    //   if (index !== -1) {
    //     return this.user[index].taxCards
    //   }
    //   return []
    // },
    ...mapState(['userList', 'gameState', 'userState'])
  },
  mounted() {
    // // checking if current room was deleted
    // if (!this.rooms.includes(this.$route.params.room)) {
    //   this.$router.push({ name: 'Home' })
    // }
    

    // this.$socket.on('socketid', socketID => {
    //   // if socket is already in list of rooms, be that guy (for vue reloading)
    //   this.users.forEach(user => {
    //     if (user.socketID === socketID) {
    //       this.name = user.name
    //       this.$emit('name-set', this.name)
    //     }
    //   })
    // })
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
            this.selectedCards
          )
          return
        case 'PLAY':
          this.$socket.emit('play-hand', this.$route.params.room, this.selectedCards)
          return
      }
    },
    passButtonClick() {
      this.$socket.emit('pass-turn', this.$route.params.room)
    },
    cardSelectChange(cardsSelectedState) {
      let selectedCards = []
      for (let i = 0; i < cardsSelectedState.length; i++) {
        if (cardsSelectedState[i]) {
          selectedCards.push(this.cards[i])
        }
      }
      this.selectedCards = selectedCards
    }
  },
  beforeRouteLeave(to, from, next) {
    // need a way to prevent this once the game ends...
    if (to.path === '/home') {
      next()
    } else {
      next(false)
    }
  }
}
</script>

<style></style>
