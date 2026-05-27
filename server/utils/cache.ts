import { Redis } from '@upstash/redis'

interface CacheEntry {
  specs: Record<string, string>
  fullModelName?: string
  categoryId: string
  productName: string
  timestamp: number
}

// Initialize Redis client from environment variables
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    return new Redis({ url, token })
  }
  return null
}

const redis = getRedis()
const CACHE_PREFIX = 'specs:'

const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

function buildCacheKey(categoryId: string, productName: string): string {
  const name = productName.toLowerCase().trim().replace(/\s+/g, ' ')
  return `${CACHE_PREFIX}${categoryId}:${name}`
}

/**
 * Try to get cached specs for a product.
 */
export async function getCachedSpecs(
  categoryId: string,
  productName: string,
  maxAgeMs: number = TTL_SECONDS * 1000
): Promise<CacheEntry | null> {
  if (!redis) return null

  try {
    const key = buildCacheKey(categoryId, productName)
    const data = await redis.get<CacheEntry>(key)
    if (!data) return null

    // Check if expired
    if (Date.now() - data.timestamp > maxAgeMs) {
      await redis.del(key)
      return null
    }

    return data
  } catch (err) {
    console.warn('[cache] read error:', err)
    return null
  }
}

/**
 * Save extracted specs to Redis cache.
 */
export async function saveToCache(
  categoryId: string,
  productName: string,
  specs: Record<string, string>,
  fullModelName?: string
) {
  if (!redis) return

  try {
    const key = buildCacheKey(categoryId, productName)
    const entry: CacheEntry = {
      specs,
      fullModelName,
      categoryId,
      productName,
      timestamp: Date.now(),
    }
    await redis.set(key, entry, { ex: TTL_SECONDS })
    console.log(`[cache] saved: ${key}`)
  } catch (err) {
    console.warn('[cache] write error:', err)
  }
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats() {
  if (!redis) {
    return { status: 'disabled', reason: 'UPSTASH_REDIS env vars not set' }
  }
  try {
    const info = await redis.info()
    return {
      status: 'connected',
      info: info?.substring(0, 200),
    }
  } catch (err) {
    return { status: 'error', error: String(err) }
  }
}
