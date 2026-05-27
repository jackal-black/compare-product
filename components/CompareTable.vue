<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <!-- Header: product names -->
      <thead>
        <tr class="border-b-2 border-gray-200">
          <th class="text-left py-3 pr-4 w-28 sm:w-36 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-white z-10">
            参数
          </th>
          <th
            v-for="product in products"
            :key="product.id"
            class="text-center py-3 px-2 sm:px-3 font-semibold text-gray-900 min-w-[120px] sm:min-w-[160px]"
          >
            <div class="flex items-center justify-center gap-1">
              <span class="truncate max-w-[100px] sm:max-w-none">{{ product.name }}</span>
              <a
                :href="getSearchUrl(product)"
                target="_blank"
                rel="noopener"
                class="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
                title="查证参数"
              >
                <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                class="text-gray-300 hover:text-red-500 transition-colors text-base leading-none shrink-0"
                title="移除"
                @click="$emit('remove', product.id)"
              >
                ×
              </button>
            </div>
            <p v-if="product.error" class="text-xs text-red-500 font-normal mt-1">{{ product.error }}</p>
          </th>
        </tr>
      </thead>

      <!-- Empty body hint -->
      <tbody v-if="products.length > 0 && !hasAnySpecs">
        <tr>
          <td :colspan="products.length + 1" class="text-center py-12 text-gray-400">
            <p class="text-2xl mb-2">🤷</p>
            <p class="text-sm">暂无参数数据</p>
            <p class="text-xs mt-1">请确认产品名称正确后重试</p>
          </td>
        </tr>
      </tbody>

      <!-- Body: grouped by section -->
      <tbody v-else>
        <template v-for="section in displaySections" :key="section.id">
          <!-- Section header -->
          <tr class="bg-gray-50 border-b border-gray-100">
            <td :colspan="products.length + 1" class="py-2 px-3">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {{ section.label }}
              </span>
            </td>
          </tr>

          <!-- Field rows -->
          <tr
            v-for="field in section.fields"
            :key="field.key"
            class="border-b border-gray-100 transition-colors duration-150"
            :class="getRowClass(field.key)"
          >
            <td class="py-2.5 pr-4 text-gray-600 text-xs sticky left-0 bg-white z-10">
              <span class="flex items-center gap-1.5">
                {{ field.label }}
                <span
                  v-if="isFieldDiff(field.key)"
                  class="inline-flex items-center gap-0.5 text-[10px] font-medium text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full"
                  title="此项有差异"
                >
                  不同
                </span>
              </span>
            </td>
            <td
              v-for="product in products"
              :key="product.id"
              class="py-2.5 px-2 sm:px-3 text-center text-sm leading-relaxed"
              :class="getCellClass(field.key, product)"
            >
              {{ getSpecValue(product, field.key) }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComparedProduct } from '~/composables/useCompare'

const props = defineProps<{
  products: ComparedProduct[]
  template: any
  displaySections: any[]
  getSpecValue: (product: ComparedProduct, key: string) => string
  getDiffRows: () => Set<string>
  fullModelNames?: Record<string, string>
}>()

defineEmits<{
  remove: [id: string]
}>()

// Check if any product has at least some specs
const hasAnySpecs = computed(() => {
  return props.products.some(p => Object.values(p.specs).some(v => v && v !== ''))
})

function getSearchUrl(product: ComparedProduct): string {
  const query = encodeURIComponent(props.fullModelNames?.[product.id] || product.name)
  return `https://search.jd.com/Search?keyword=${query}&enc=utf-8`
}

function isFieldDiff(fieldKey: string): boolean {
  if (props.products.length < 2) return false
  return props.getDiffRows().has(fieldKey)
}

function getRowClass(fieldKey: string) {
  const classes: string[] = []
  if (isFieldDiff(fieldKey)) {
    classes.push('bg-yellow-50/70 hover:bg-yellow-50')
  } else {
    classes.push('hover:bg-gray-50/50')
  }
  return classes
}

function getCellClass(fieldKey: string, product: ComparedProduct) {
  const classes: string[] = []
  if (props.products.length >= 2 && isFieldDiff(fieldKey)) {
    classes.push('font-medium text-gray-900')
  } else {
    classes.push('text-gray-600')
  }
  return classes
}
</script>
