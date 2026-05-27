import { getAllTemplateMeta } from '../utils/templates'

export default defineEventHandler(() => {
  return getAllTemplateMeta()
})
