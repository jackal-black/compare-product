<template>
  <div class="min-h-screen bg-gray-50">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s - 参数对兑',
  meta: [
    { name: 'description', content: '简洁的产品参数对比工具，帮助你在最后一步做出选择' }
  ]
})
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
