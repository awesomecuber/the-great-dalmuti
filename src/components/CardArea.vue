<template>
  <div id="play-area">
    <div id="deck">
      <Card
        id="current-card"
        :number="currentCard"
        :large="true"
        :selected="false"
      />
      <h3 id="current-card-count">x{{ currentCardCount }}</h3>
    </div>

    <h3>Your hand:</h3>
    <div id="cards">
      <Card
        v-for="(card, index) in playerCards"
        @tap="click(index)"
        :key="index"
        :number="card"
        :selected="selected[index]"
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
  data() {
    return {
      selected: [],
      selectable: false
    }
  },
  props: {
    currentCard: Number,
    currentCardCount: Number,
    playerCards: Array,
    mandatoryTaxed: Number,
    taxSubmitted: Array
  },
  watch: {
    playerCards: function() {
      // this.initializeSelected()
    },
    taxSubmitted: function(newTax, oldTax) {
      if (newTax.length !== oldTax.length) {
        this.initializeSelected()
      }
      let same = true
      for (let i = 0; i < newTax.length; i++) {
        if (newTax[i] !== oldTax[i]) {
          same = false
        }
      }
      if (!same) {
        this.initializeSelected()
      }
    }
  },
  mounted() {
    this.initializeSelected()
  },
  methods: {
    initializeSelected() {
      this.selected = []
      for (let i = 0; i < this.playerCards.length; i++) {
        this.selected.push(i < this.mandatoryTaxed)
      }
      this.selectable = this.mandatoryTaxed === 0

      if (this.taxSubmitted.length > 0) {
        this.selectable = false
        let j = 0
        for (let i = 0; i < this.selected.length; i++) {
          if (this.taxSubmitted[j] === this.playerCards[i]) {
            j++
            this.selected[i] = true
          }
        }
      }
      this.$emit('card-select-change', this.selected)
    },
    click(index) {
      if (this.selectable) {
        this.selected.splice(index, 1, !this.selected[index])
      }
      this.$emit('card-select-change', this.selected)
    }
  }
}
</script>

<style>
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
  width: 80%;
  margin-bottom: 15px;
}

.text-margin {
  margin: 10px 20px;
}
</style>
