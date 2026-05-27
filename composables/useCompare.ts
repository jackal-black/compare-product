export interface TemplateField {
  key: string
  label: string
  unit?: string
}

export interface TemplateSection {
  id: string
  label: string
  fields: TemplateField[]
}

export interface CategoryTemplate {
  id: string
  name: string
  icon: string
  sections: TemplateSection[]
}

export interface ComparedProduct {
  id: string
  name: string
  categoryId: string
  specs: Record<string, string>
  loading?: boolean
  error?: string
}

export type SortMode = 'group' | 'diff-first'

export const useCompare = () => {
  const products = ref<ComparedProduct[]>([])
  const template = ref<CategoryTemplate | null>(null)
  const sortMode = ref<SortMode>('group')

  function addProduct(p: ComparedProduct) {
    if (products.value.length >= 4) return
    if (products.value.find(x => x.id === p.id)) return
    products.value.push(p)
  }

  function removeProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
  }

  function setTemplate(t: CategoryTemplate) {
    template.value = t
  }

  function clearAll() {
    products.value = []
    template.value = null
  }

  /**
   * Detect which rows have differences across products
   */
  function getDiffRows(): Set<string> {
    const diff = new Set<string>()
    if (products.value.length < 2) return diff

    for (const section of template.value?.sections ?? []) {
      for (const field of section.fields) {
        const values = products.value.map(p => p.specs[field.key] || '').filter(Boolean)
        if (new Set(values).size > 1) {
          diff.add(field.key)
        }
      }
    }
    return diff
  }

  /**
   * Get sections with fields, optionally sorting diff sections first
   */
  function getDisplaySections(): (TemplateSection & { fieldsWithDiff: Record<string, boolean> })[] {
    if (!template.value) return []

    const diffRows = getDiffRows()

    const sections = template.value.sections.map(s => ({
      ...s,
      fieldsWithDiff: Object.fromEntries(
        s.fields.map(f => [f.key, diffRows.has(f.key)])
      ),
    }))

    if (sortMode.value === 'diff-first') {
      sections.sort((a, b) => {
        const aDiff = a.fields.filter(f => diffRows.has(f.key)).length
        const bDiff = b.fields.filter(f => diffRows.has(f.key)).length
        return bDiff - aDiff
      })
    }

    return sections
  }

  /**
   * Get a spec value display text
   */
  function getSpecValue(product: ComparedProduct, fieldKey: string): string {
    return product.specs[fieldKey] || '-'
  }

  return {
    products,
    template,
    sortMode,
    addProduct,
    removeProduct,
    setTemplate,
    clearAll,
    getDiffRows,
    getDisplaySections,
    getSpecValue,
  }
}
