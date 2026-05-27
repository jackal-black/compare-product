import { getTemplate } from '../utils/templates'
import { extractWithAI } from '../utils/ai-extract'
import { fetchPageContent } from '../utils/search'
import { getCachedSpecs, saveToCache } from '../utils/cache'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    productName: string
    categoryId: string
    urls?: string[]
  }>(event)
  const { productName, categoryId, urls } = body

  if (!productName) {
    throw createError({ statusCode: 400, statusMessage: '缺少产品名称' })
  }

  const template = getTemplate(categoryId)
  if (!template) {
    throw createError({ statusCode: 400, statusMessage: `不支持的品类: ${categoryId}` })
  }

  // ---- 1. Check cache first ----
  const cached = await getCachedSpecs(categoryId, productName)
  if (cached) {
    console.log(`[cache] HIT: ${categoryId}/${productName}`)
    return {
      success: true,
      specs: cached.specs,
      productName,
      fullModelName: cached.fullModelName || productName,
      categoryId,
      cached: true,
    }
  }
  console.log(`[cache] MISS: ${categoryId}/${productName}`)

  // ---- 2. Fetch web content (optional) ----
  let rawContent = ''
  if (urls && urls.length > 0) {
    const contents = await Promise.all(
      urls.slice(0, 2).map(url => fetchPageContent(url))
    )
    rawContent = contents.filter(Boolean).join('\n\n')
  }
  if (!rawContent) {
    rawContent = `产品名称: ${productName}\n品类: ${template.name}\n请根据您对 ${productName} 的知识提供完整的参数信息。`
  }

  // ---- 3. Extract specs using AI ----
  const result = await extractWithAI({
    productName,
    template,
    rawContent,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      specs: {},
      productName,
      categoryId,
    }
  }

  // ---- 4. Save to cache ----
  await saveToCache(categoryId, productName, result.specs, result.fullModelName)
  console.log(`[cache] SAVED: ${categoryId}/${productName}`)

  return {
    success: true,
    specs: result.specs,
    productName,
    fullModelName: result.fullModelName || productName,
    categoryId,
    cached: false,
  }
})
