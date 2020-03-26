<template>
  <div id="play-area">
    <p id="turn-display">
      It is <b>{{ turn }}</b
      >'s turn.
    </p>
    <br />
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
    turn: String,
    currentCard: Number,
    currentCardCount: Number,
    playerCards: Array
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
