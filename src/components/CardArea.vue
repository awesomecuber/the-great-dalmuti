<template>
  <div id="play-area">
    <div id="deck">
      <Card
        id="current-card"
        :number="gameState.currentCard"
        :large="true"
        :selected="false"
      />
      <h3 id="current-card-count">x{{ gameState.currentCardCount }}</h3>
    </div>

    <h3>Your hand:</h3>
    <div id="cards">
      <Card
        v-for="(card, index) in userState.cards"
        @tap="click(index)"
        :key="index"
        :number="card"
        :selected="selected.includes(index)"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Card from './CardArea/Card.vue'

export default {
  name: 'CardArea',
  components: {
    Card
  },
  data() {
    return {
      userSelected: []
    }
  },
  computed: {
    ...mapState(['gameState', 'userState']),
    selected: function() {
      if (this.selectable) {
        return this.userSelected
      } else {
        return this.userState.taxCardIndexes
      }
    },
    selectable: function() {
      return !(this.gameState.state === 'REVOLUTION' ||
              (this.gameState.state === 'TAX' && this.userState.taxSubmitted))
    },
    cardLength: function() {
      return this.userState.cards.length
    }
  },
  watch: {
    selectable: function(newSelectable, oldSelectable) {
      if (oldSelectable === false && newSelectable === true) {
        this.userSelected = []
      }
    },
    cardLength: function(newLength, oldLength) {
      if (newLength < oldLength) {
        this.userSelected = []
      }
    }
  },
  methods: {
    click(index) {
      if (this.selectable) {
        if (this.userSelected.includes(index)) {
          this.userSelected.splice(this.userSelected.indexOf(index), 1)
        } else {
          this.userSelected.push(index)
          this.userSelected.sort((a, b) => a - b)
        }
        this.$emit('card-select-change', this.userSelected)
      }
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
