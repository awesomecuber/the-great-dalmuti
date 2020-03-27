<template>
  <div
    @click="selected = selectable ? !selected : selected"
    class="card"
    :style="[colorStyle, sizeStyle, selectedColorStyle]"
  >
    {{ display }}
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    number: {
      type: Number,
      default: 0 // represents no card
    },
    large: {
      type: Boolean,
      default: false
    },
    selectable: {
      type: Boolean,
      required: true
    },
    startingState: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selected: false
    }
  },
  computed: {
    display: function() {
      if (this.number === 99) {
        return 'J'
      }
      if (this.number === 0) {
        return ''
      }
      return this.number.toString()
    },
    colorStyle: function() {
      if (this.number === 99) {
        return {
          backgroundColor: 'black'
        }
      }
      let color = 'white'
      switch (this.number) {
        case 1:
          color = 'gold'
          break
        case 2:
          color = 'tomato'
          break
        case 3:
          color = 'mediumseagreen'
          break
        case 4:
          color = 'violet'
          break
        case 5:
          color = 'tan'
          break
        case 6:
          color = 'rebeccapurple'
          break
        case 7:
          color = 'pink'
          break
        case 8:
          color = 'skyblue'
          break
        case 9:
          color = 'orange'
          break
        case 10:
          color = 'brown'
          break
        case 11:
          color = 'lightslategray'
          break
        case 12:
          color = 'indianred'
          break
        case 99:
          color = 'lightgray'
          break
      }
      return {
        backgroundColor: color
      }
    },
    sizeStyle: function() {
      if (this.large) {
        return {
          width: '80px',
          height: '100px',
          border: '5px solid black',
          fontSize: '48px'
        }
      }
      return {
        width: '60px',
        height: '70px',
        borderWidth: '3px',
        borderStyle: 'solid',
        fontSize: '36px'
      }
    },
    selectedColorStyle: function() {
      if (this.selected) {
        return {
          color: 'hotpink',
          borderColor: 'hotpink'
        }
      }
      return {
        color: this.number === 99 ? 'white' : 'black',
        borderColor: 'black'
      }
    }
  },
  mounted() {
    this.selected = this.startingState
  },
  watch: {
    startingState: function(newVal) {
      this.selected = newVal
    }
  }
}
</script>

<style scoped>
.card {
  padding: 15px;
  margin: 1px;
  text-align: center;
  cursor: pointer;
}
</style>
