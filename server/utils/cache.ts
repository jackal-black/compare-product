import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

interface CacheEntry {
  specs: Record<string, string>
  fullModelName?: string
  categoryId: string
  productName: string
  timestamp: number
}

// Look for cache in the project's server/data/ directory
// Prefer project subdirectory to avoid polluting workspace root
function findCacheDir(): string {
  const candidates = [
    join(process.cwd(), 'product-compare', 'server', 'data'),   // prod: cwd=workspace root
    join(process.cwd(), 'server', 'data'),                      // dev: cwd=project
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  // Default to workspace-root/project-name path (production)
  const defaultDir = join(process.cwd(), 'product-compare', 'server', 'data')
  mkdirSync(defaultDir, { recursive: true })
  return defaultDir
}

const CACHE_DIR = findCacheDir()
const CACHE_FILE = join(CACHE_DIR, 'specs-cache.json')

function loadCache(): Record<string, CacheEntry> {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // If file is corrupted, start fresh
  }
  return {}
}

function saveCache(cache: Record<string, CacheEntry>) {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

function buildCacheKey(categoryId: string, productName: string): string {
  return `${categoryId}:${normalizeName(productName)}`
}

export function getCachedSpecs(
  categoryId: string,
  productName: string,
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000
): CacheEntry | null {
  const cache = loadCache()
  const key = buildCacheKey(categoryId, productName)
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > maxAgeMs) return null
  return entry
}

export function saveToCache(
  categoryId: string,
  productName: string,
  specs: Record<string, string>,
  fullModelName?: string
) {
  const cache = loadCache()
  const key = buildCacheKey(categoryId, productName)
  cache[key] = { specs, fullModelName, categoryId, productName, timestamp: Date.now() }
  saveCache(cache)
}

export function getCacheStats() {
  const cache = loadCache()
  const entries = Object.values(cache)
  const now = Date.now()
  return {
    cacheFile: CACHE_FILE,
    totalEntries: entries.length,
    expiredEntries: entries.filter(e => now - e.timestamp > 30 * 24 * 60 * 60 * 1000).length,
    oldestEntry: entries.length ? new Date(Math.min(...entries.map(e => e.timestamp))).toISOString() : null,
    newestEntry: entries.length ? new Date(Math.max(...entries.map(e => e.timestamp))).toISOString() : null,
  }
}
