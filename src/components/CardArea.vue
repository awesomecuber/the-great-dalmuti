<template>
  <div id="play-area">
    <div id="deck">
      <Card id="current-card" :large="true" :selectable="false" />
      <h3 id="current-card-count">x{{ currentCardCount }}</h3>
    </div>

    <h3>Your hand:</h3>
    <div id="cards">
      <Card
        v-for="(card, index) in playerCards"
        :key="index"
        :number="card"
        :selectable="mandatoryTaxed === 0"
        :startingState="mandatoryTax(index)"
      />
    </div>
  </div>
</template>

<script>
import Card from './CardArea/Card.vue'

export default {
  name: 'CardArea',
  components: {
    Card
  },
  props: {
    currentCard: Number,
    currentCardCount: Number,
    playerCards: Array,
    mandatoryTaxed: Number
  },
  methods: {
    mandatoryTax(index) {
      return index < this.mandatoryTaxed
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
  margin-bottom: 15px;
}

.text-margin {
  margin: 10px 20px;
}
</style>
