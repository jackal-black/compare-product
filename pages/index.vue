<template>
  <div class="max-w-5xl mx-auto px-4 py-6 sm:py-8">
    <!-- Header -->
    <header class="text-center mb-8 sm:mb-10">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        参数<span class="text-primary-600">对兑</span>
      </h1>
      <p class="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm">
        最后一步，比清楚再买
      </p>
    </header>

    <!-- Category selector -->
    <div class="flex flex-wrap justify-center gap-2 mb-6">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200"
        :class="selectedCategory === cat.id
          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'"
        @click="selectCategory(cat.id)"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <SearchBox
        :category-name="selectedCategoryName"
        @add="onProductAdd"
      />
    </div>

    <!-- Selected products strip + count -->
    <TransitionGroup
      v-if="compareProducts.length > 0"
      name="product-list"
      tag="div"
      class="mb-4"
    >
      <!-- Product count badge -->
      <div key="count-badge" class="text-xs text-gray-500 mb-2 text-center sm:text-left">
        已选 <span class="font-semibold text-primary-600">{{ compareProducts.length }}</span> / 4 款产品
        <button
          class="ml-2 text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
          @click="resetAll"
        >
          清空
        </button>
      </div>

      <!-- Product cards grid -->
      <div
        key="product-grid"
        class="grid gap-2 sm:gap-3"
        :style="{ gridTemplateColumns: `repeat(${Math.max(compareProducts.length, 1)}, 1fr)` }"
      >
        <ProductCard
          v-for="product in compareProducts"
          :key="product.id"
          :name="product.name"
          :loading="product.loading"
          :error="product.error"
          selected
          removable
          @remove="removeProduct(product.id)"
        />
      </div>
    </TransitionGroup>

    <!-- Extract & Compare button -->
    <Transition name="fade-slide">
      <div v-if="compareProducts.length >= 2" class="text-center mb-6">
        <button
          class="px-8 py-3 bg-primary-600 text-white rounded-xl font-medium
                 hover:bg-primary-700 active:bg-primary-800 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          :disabled="extracting"
          @click="startExtractAll"
        >
          <span v-if="extracting" class="flex items-center gap-2 justify-center">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            正在提取参数...
          </span>
          <span v-else>✨ 开始对比</span>
        </button>
      </div>
    </Transition>

    <!-- Sort mode toggle -->
    <div v-if="showTable" class="flex justify-end mb-3 gap-2">
      <button
        class="text-xs px-3 py-1.5 rounded-lg border transition-all duration-200"
        :class="sortMode === 'group'
          ? 'border-primary-300 bg-primary-50 text-primary-700'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'"
        @click="sortMode = 'group'"
      >
        按分类排列
      </button>
      <button
        class="text-xs px-3 py-1.5 rounded-lg border transition-all duration-200"
        :class="sortMode === 'diff-first'
          ? 'border-primary-300 bg-primary-50 text-primary-700'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'"
        @click="sortMode = 'diff-first'"
      >
        差异优先
      </button>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="extracting"
      class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div class="p-6 animate-pulse space-y-4">
        <div class="flex gap-4">
          <div class="h-4 bg-gray-200 rounded w-24"></div>
          <div class="h-4 bg-gray-200 rounded w-32"></div>
          <div class="h-4 bg-gray-200 rounded w-28"></div>
        </div>
        <div v-for="i in 5" :key="i" class="flex gap-4">
          <div class="h-3 bg-gray-100 rounded w-20"></div>
          <div class="h-3 bg-gray-100 rounded w-28"></div>
          <div class="h-3 bg-gray-100 rounded w-32"></div>
          <div class="h-3 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
    </div>

    <!-- Compare table -->
    <Transition name="fade-slide">
      <div
        v-if="showTable"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <!-- Mobile scroll hint -->
        <div class="sm:hidden text-center py-1.5 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
          ← 左右滑动查看全部对比 →
        </div>
        <CompareTable
          :products="compareProducts"
          :template="compareTemplate"
          :display-sections="getDisplaySections()"
          :get-spec-value="getSpecValue"
          :get-diff-rows="getDiffRows"
          :full-model-names="fullModelNames"
          @remove="removeProduct"
        />
      </div>
    </Transition>

    <!-- Footer -->
    <footer class="text-center mt-10 sm:mt-12 text-xs text-gray-400">
      参数对兑 — 简洁的产品对比工具
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompare } from '~/composables/useCompare'

useHead({ title: '参数对兑' })

// Template data
interface CategoryMeta {
  id: string
  name: string
  icon: string
}
interface CategoryTemplate {
  id: string
  name: string
  icon: string
  sections: any[]
}

const categories = ref<CategoryMeta[]>([])
const selectedCategory = ref('phone')
const extracting = ref(false)
const showTable = ref(false)
const fullModelNames = ref<Record<string, string>>({})

const {
  products: compareProducts,
  template: compareTemplate,
  sortMode,
  addProduct,
  removeProduct,
  setTemplate,
  clearAll,
  getDiffRows,
  getDisplaySections,
  getSpecValue,
} = useCompare()

const selectedCategoryName = computed(() => {
  return categories.value.find(c => c.id === selectedCategory.value)?.name || ''
})

// Load categories on mount
onMounted(async () => {
  try {
    categories.value = await $fetch<CategoryMeta[]>('/api/categories')
  } catch {
    categories.value = [
      { id: 'phone', name: '手机', icon: '📱', sectionCount: 8, fieldCount: 20 },
      { id: 'laptop', name: '笔记本', icon: '💻', sectionCount: 8, fieldCount: 20 },
      { id: 'headphone', name: '耳机', icon: '🎧', sectionCount: 6, fieldCount: 15 },
    ]
  }
})

async function selectCategory(id: string) {
  selectedCategory.value = id
  clearAll()
  fullModelNames.value = {}
  showTable.value = false
}

// Product selection handler
function onProductAdd(name: string) {
  const id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  addProduct({
    id,
    name,
    categoryId: selectedCategory.value,
    specs: {},
    loading: false,
  })
}

// Extract specs for all products
async function startExtractAll() {
  extracting.value = true
  showTable.value = false

  // Load the full template with sections
  if (!compareTemplate.value) {
    try {
      const tpl = await $fetch<CategoryTemplate>(
        `/api/template?id=${selectedCategory.value}`
      )
      setTemplate(tpl)
    } catch {
      setTemplate({
        id: selectedCategory.value,
        name: categories.value.find(c => c.id === selectedCategory.value)?.name || '',
        icon: '',
        sections: [],
      })
    }
  }

  for (const product of compareProducts.value) {
    product.loading = true
    product.error = undefined

    try {
      const result = await $fetch<{
        success: boolean
        specs: Record<string, string>
        fullModelName?: string
        error?: string
      }>('/api/extract', {
        method: 'POST',
        body: {
          productName: product.name,
          categoryId: product.categoryId,
        },
      })

      if (result.success && result.specs) {
        product.specs = result.specs
        if (result.fullModelName) {
          fullModelNames.value[product.id] = result.fullModelName
        }
      } else {
        product.error = result.error || '提取失败'
      }
    } catch (e: any) {
      product.error = e?.message || '请求失败'
    } finally {
      product.loading = false
    }
  }

  extracting.value = false
  showTable.value = true
}

function resetAll() {
  clearAll()
  fullModelNames.value = {}
  showTable.value = false
}
</script>

<style>
body {
  background-color: #f8fafc;
}

/* Product list transitions */
.product-list-enter-active,
.product-list-leave-active {
  transition: all 0.3s ease;
}
.product-list-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
.product-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.product-list-move {
  transition: transform 0.3s ease;
}

/* Fade + slide transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
