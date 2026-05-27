import { clearCache } from '../utils/cache'

 export default defineEventHandler(async () => {
   const result = await clearCache()
   return result
 })
