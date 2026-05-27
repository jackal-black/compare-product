<template>
  <form class="flex gap-3 items-center" @submit.prevent="onAdd">
    <div class="relative flex-1">
      <input
        v-model="text"
        type="text"
        :placeholder="`输入${categoryName || '产品'}名称`"
        class="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-200 rounded-xl text-sm
               focus:border-primary-500 outline-none transition-all"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <button
      type="submit"
      class="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      + 添加对比
    </button>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  categoryName?: string
}>()

const emit = defineEmits<{
  (e: 'add', name: string): void
}>()

const text = ref('')

function onAdd() {
  const name = text.value.trim()
  if (!name) return
  console.log('SearchBox emit add:', name)
  emit('add', name)
  text.value = ''
}
</script>
