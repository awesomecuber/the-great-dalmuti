<template>
  <div class="card" :style="[colorStyle, sizeStyle]">{{ display }}</div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    number: Number,
    large: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    display: function() {
      if (this.number === 99) {
        return 'J'
      }
      return this.number.toString()
    },
    colorStyle: function() {
      if (this.number === 99) {
        return {
          backgroundColor: 'black',
          color: 'white'
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
        border: '2px solid black',
        fontSize: '36px'
      }
    }
  }
}
</script>

<style scoped>
.card {
  padding: 15px;
  margin: 1px;
  text-align: center;
}
</style>
