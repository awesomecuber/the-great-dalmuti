<template>
  <div class="room">
    <center>
      <div class="column is-one-third">
        <div class="header">
          <div class="box">
            <h1 class="title" style="margin-bottom: 0px; margin-top: 10px">
              The Great Dalmuti
            </h1>
            <h2 style="margin: 5px">
              Room: {{ $route.params.room
              }}<span v-if="name !== ''"> | Your Name: {{ name }}</span>
              <!-- TODO: also show role (Lesser Peon, Merchant, etc) -->
            </h2>
          </div>
        </div>
      </div>
      <hr />
      <router-view />
    </center>
  </div>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'Room',
  computed: mapState({
    name: (state) => state.userState.name,
  }),
  beforeMount() {
    this.$socket.emit('enter-room', this.$route.params.room)
    window.onbeforeunload = () => {
      this.$socket.emit('leave-room', this.$route.params.room)
    }
  },
  methods: {
    leave() {
      this.$socket.emit('leave-room', this.$route.params.room)
      this.$store.dispatch('resetState')
      this.$router.push('/home')
    },
  },
}
</script>

<style scoped>
body {
  background-color: whitesmoke;
  font-family: sans-serif;
}

#leave {
  position: absolute;
  top: 5px;
  left: 5px;
}
</style>
