<template>
  <div id="game">
    <p id="display" v-html="displayText"></p>
    <br />
    <card-area
      turn="BlueCrystal004"
      :currentCard="12"
      :currentCardCount="5"
      :playerCards="cards"
      :mandatoryTaxed="mandatoryTax"
    />
    <button>
      <h1 class="text-margin">PLAY</h1>
    </button>
    <br />
    <br />
    <info-area :lastMoves="lastMoves" trickLead="LordGeek101" :users="users" />
  </div>
</template>

<script>
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
      rooms: [],
      users: [],
      name: '',
      gameState: '',
      revolutionTimeLeft: 5, // need to remember to reset somehow after revolution
      cards: [],
      lastMoves: [
        '<i>geek</i> played <b>five 10s</b>',
        '<i>jon</i> played <b>five 9s</b>',
        '<i>nico</i> played <b>five 8s</b>',
        '<i>frogyfro</i> played <b>five 12s</b>',
        '<i>aidan</i> <b>passed</p>'
      ],
      turn: 'BlueCrystal004',
      gameEnded: false // to recognize when to prevent next(false)
    }
  },
  computed: {
    playerRole: function() {
      let rank = this.users.map(user => user.name).indexOf(this.name)
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
      switch (this.gameState) {
        case 'REVOLUTION':
          return `Revolution Stage: ${this.revolutionTimeLeft}s`
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
            return 'Tax stage'
          }
        case 'PLAY':
          return `It is <b>${this.turn}</b>'s turn.`
      }
      return 'UHHH'
    },
    mandatoryTax: function() {
      if (this.gameState !== 'TAX') {
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
    }
  },
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about room names
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) {
          this.users = room.users // saving users
          this.gameState = room.state
        }
      })

      let numUsers = 0
      // update cards
      this.users.forEach(user => {
        if (user.name === this.name) {
          this.cards = user.cards
        }
        if (!user.left) {
          numUsers++
        }
      })
      console.log(numUsers)
      if (numUsers < 4) {
        this.$socket.emit('room-removed', this.$route.params.room)
      }

      // checking if current room was deleted
      if (!this.rooms.includes(this.$route.params.room)) {
        this.$router.push('/home')
      }
    })

    this.$socket.emit('request-rooms')

    this.$socket.on('socketid', socketID => {
      // if socket is already in list of rooms, be that guy (for vue reloading)
      this.users.forEach(user => {
        if (user.socketID === socketID) {
          this.name = user.name
          this.$emit('name-set', this.name)
        }
      })
    })
    // i only do this because for some reason, this.$socket.id is undefined
    this.$socket.emit('request-socketid')

    this.$socket.emit('request-rooms') // megadumb

    this.$socket.on('revolution-timer-update', timeLeft => {
      this.revolutionTimeLeft = timeLeft
    })

    this.$socket.on('disconnect', reason => {
      if (reason === 'io client disconnect') {
        this.$socket.emit('user-left', this.$route.params.room)
      }
    })
  },
  methods: {},
  beforeRouteLeave(to, from, next) {
    if (to.path === '/home') {
      next()
    } else {
      next(false)
    }
  }
}
</script>

<style></style>
