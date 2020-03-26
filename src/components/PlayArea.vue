<template>
  <div>
    <p id="turn-display">
      It is <b>{{ turn }}</b
      >'s turn.
    </p>

    <div id="deck">
      <Card id="current-card" :number="currentCard" :large="true" />
      <h3 id="current-card-count">x{{ currentCardCount }}</h3>
    </div>

    <h3>Your hand:</h3>
    <div id="cards">
      <Card v-for="(card, index) in playerCards" :key="index" :number="card" />
    </div>
  </div>
</template>

<script>
import Card from './PlayArea/Card.vue'

export default {
  name: 'PlayArea',
  components: {
    Card
  },
  props: {
    turn: {
      type: String,
      required: false // because taxes
    },
    currentCard: {
      type: Number,
      required: false // because at the start, theres no current
    },
    currentCardCount: {
      // ie, 3 cards at a time
      type: Number,
      required: false // because at the start, theres no current
    },
    playerCards: {
      type: Array,
      required: true
    }
  }
}
</script>

<style>
#turn-display {
  font-size: 20px;
  margin: 5px 0px;
}

#deck {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  border: 2px solid black;
}

#current-card {
  margin: 3px 3px;
}

#current-card-count {
  margin: 5px 0;
}

#cards {
  display: flex;
  justify-content: center;
  width: 70%;
}
</style>
