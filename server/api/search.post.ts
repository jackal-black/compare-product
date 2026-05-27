import { searchProduct } from '../utils/search'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ query: string; categoryId: string }>(event)
  const { query, categoryId } = body

  if (!query || !query.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入产品名称' })
  }

  const searchQuery = categoryId
    ? `${query} ${categoryId === 'phone' ? '手机' : categoryId === 'laptop' ? '笔记本' : '耳机'} 参数规格`
    : `${query} 参数规格`

  const results = await searchProduct(searchQuery)

  return {
    success: true,
    results,
    query: searchQuery,
  }
})
