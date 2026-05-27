import { getTemplate } from '../utils/templates'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 template id' })
  }

  const template = getTemplate(id)
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: `未找到模板: ${id}` })
  }

  return template
})
