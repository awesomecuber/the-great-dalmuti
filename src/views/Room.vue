<template>
  <div class="room">
    <center>
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
