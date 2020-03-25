<template>
  <div class="card" :style="[colorStyle, sizeStyle]">{{ number }}</div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    number: {
      validator: function(value) {
        return (
          [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            'J'
          ].indexOf(value) !== -1
        )
      },
      required: true
    },
    large: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    colorStyle: function() {
      let color = 'white'
      switch (this.number) {
        case '1':
          color = 'gold'
          break
        case '2':
          color = 'aqua'
          break
        case '3':
          // color = 'white'
          break
        case '4':
          color = 'lime'
          break
        case '5':
          // color = 'white'
          break
        case '6':
          // color = 'white'
          break
        case '7':
          color = 'pink'
          break
        case '8':
          // color = 'white'
          break
        case '9':
          color = 'royalblue'
          break
        case '10':
          // color = 'white'
          break
        case '11':
          // color = 'white'
          break
        case '12':
          color = 'indianred'
          break
        case 'J':
          // color = 'white'
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
