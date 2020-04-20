<template>
  <div class="room">
    <button @click="leave" id="leave">
      <h2 style="margin: 5px;">Go Home</h2>
    </button>
    <center>
      <div class="header">
        <h1 style="margin-bottom: 0px; margin-top: 0px;">The Great Dalmuti</h1>
        <h2 style="margin: 0px;">
          Room: {{ $route.params.room
          }}<span v-if="name !== ''"> | Your Name: {{ name }}</span>
          <!-- TODO: also show role (Lesser Peon, Merchant, etc) -->
        </h2>
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
    name: state => state.userState.name
  }),
  beforeMount() {
    window.onbeforeunload = () => {
      this.$socket.emit('user-left', this.$route.params.room)
    }
  },
  methods: {
    leave() {
      this.$socket.emit('user-left', this.$route.params.room)
      this.$router.push('/home')
    }
  }
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
