<template>
  <div id="game">
    <p id="turn-display">
      It is <b>{{ turn }}</b
      >'s turn.
    </p>
    <br />
    <card-area
      turn="BlueCrystal004"
      :currentCard="12"
      :currentCardCount="5"
      :playerCards="cards"
      :mandatoryTaxed="1"
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
  mounted() {
    this.$socket.removeAllListeners()

    this.$socket.on('room-update', rooms => {
      this.rooms = rooms.map(room => room.name) // i only care about room names
      rooms.forEach(room => {
        if (room.name === this.$route.params.room) {
          this.users = room.users // saving users
        }
      })

      // update cards
      this.users.forEach(user => {
        if (user.username === this.name) {
          this.cards = user.cards
        }
      })

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
          this.name = user.username
          this.$emit('name-set', this.name)
        }
      })
    })
    // i only do this because for some reason, this.$socket.id is undefined
    this.$socket.emit('request-socketid')

    this.$socket.emit('request-rooms') // megadumb

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
