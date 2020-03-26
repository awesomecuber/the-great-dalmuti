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
        </h2>
      </div>
      <hr />
      <router-view @name-set="setName" />
    </center>
  </div>
</template>

<script>
export default {
  name: 'Room',
  data() {
    return {
      name: ''
    }
  },
  beforeMount() {
    window.onbeforeunload = () => {
      this.$socket.emit('user-left', this.$route.params.room)
    }
  },
  methods: {
    leave() {
      this.$socket.emit('user-left', this.$route.params.room)
      this.$router.push('/home')
    },
    setName(name) {
      this.name = name
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
