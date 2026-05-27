 import { getCacheStats } from '../utils/cache'

 export default defineEventHandler(async () => {
   const stats = await getCacheStats()
   return stats
 })
