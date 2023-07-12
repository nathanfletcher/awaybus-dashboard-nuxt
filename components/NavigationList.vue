<template>
    <div>
      <v-list
          :items="items"
        ></v-list>
    </div>
</template>
<script>
  export default {
    data: () => ({
      items: [
        {
          title: 'Foo',
          value: 'foo',
        },
        {
          title: 'Bar',
          value: 'bar',
        },
        {
          title: 'Fizz',
          value: 'fizz',
        },
        {
          title: 'Buzz',
          value: 'buzz',
        },
      ],
    }),
  }
</script>