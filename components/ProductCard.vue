<template>
  <div
    class="relative bg-white rounded-xl border-2 p-4 transition-all"
    :class="[
      selected ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300',
      removable ? 'cursor-default' : 'cursor-pointer'
    ]"
  >
    <!-- Remove button -->
    <button
      v-if="removable"
      class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors flex items-center justify-center"
      @click="$emit('remove')"
    >
      ×
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse space-y-2">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-3 bg-gray-100 rounded w-1/2"></div>
    </div>

    <!-- Product info -->
    <div v-else>
      <h3 class="font-semibold text-gray-900 text-sm truncate">{{ name }}</h3>
      <p v-if="subtitle" class="text-xs text-gray-500 mt-0.5">{{ subtitle }}</p>
    </div>

    <!-- Error state -->
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  subtitle?: string
  selected?: boolean
  removable?: boolean
  loading?: boolean
  error?: string
}>()

defineEmits<{
  remove: []
}>()
</script>
