<template>
  <div id="info-area">
    <div id="last-moves" class="margin">
      <p><b>Last 5 moves:</b></p>
      <p class="left">
        <span v-for="(move, index) in lastMoves" :key="index">
          <b>{{ index + 1 }}. </b>
          <span v-html="move"></span>
          <br v-if="index !== lastMoves.length - 1" />
        </span>
      </p>
      <b>This trick led by: </b> {{ gameState.trickLead }}
    </div>
    <div class="margin">
      <p><b>Standings:</b></p>
      <p class="left">
        <span v-for="(user, index) in users" :key="index">
          <b>{{ index + 1 }}. </b><tt>{{ getRole(index) }}</tt>
          {{ user.name }} [<b>{{ user.cardCount }}</b
          >] <i v-if="user.left"> (user left)</i>
          <!-- show if a user won -->
          <br v-if="index !== lastMoves.length - 1" />
        </span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'InfoArea',
  props: {
    lastMoves: Array
  },
  computed: mapState(['users', 'gameState', 'userState']),
  methods: {
    getRole(index) {
      if (index === 0) {
        return 'GD'
      } else if (index === 1) {
        return 'LD'
      } else if (index === this.users.length - 2) {
        return 'LP'
      } else if (index === this.users.length - 1) {
        return 'GP'
      } else {
        return 'M'
      }
    }
  }
}
</script>

<style>
#info-area {
  display: inline-flex;
  justify-content: center;
  border: 5px solid black;
}

.margin {
  margin: 10px 20px;
}

.left {
  text-align: left;
}
</style>
