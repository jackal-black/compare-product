interface SearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * 使用 SerpAPI 或直接抓取搜索引擎结果
 * 这里先用模拟搜索 + 真实页面抓取的方式
 * 后续可替换为 SerpAPI / Bing Search API
 */
export async function searchProduct(query: string): Promise<SearchResult[]> {
  // Try SerpAPI first if configured
  const serpApiKey = process.env.SERPAPI_API_KEY || ''
  if (serpApiKey) {
    return searchWithSerpApi(query, serpApiKey)
  }

  // Fallback: return empty - user will need to configure an API key
  return []
}

async function searchWithSerpApi(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: 'google',
      num: '8',
      hl: 'zh-cn',
    })
    const response = await fetch(`https://serpapi.com/search?${params}`)
    if (!response.ok) return []

    const data = await response.json()
    const results: SearchResult[] = (data.organic_results || []).map((r: any) => ({
      title: r.title || '',
      url: r.link || '',
      snippet: r.snippet || '',
    }))
    return results
  } catch {
    return []
  }
}

/**
 * 抓取产品页面内容用于 AI 提取
 */
export async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    const html = await response.text()

    // Strip HTML tags, keep text content
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000)

    return text
  } catch {
    return ''
  }
}

/**
 * SerpAPI 提取功能 - 直接拿结构化数据
 */
export async function fetchProductSpecsViaSearch(productName: string, categoryId: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.SERPAPI_API_KEY || ''
  if (!apiKey) return null

  try {
    const params = new URLSearchParams({
      q: `${productName} ${getCategorySpecQuery(categoryId)}`,
      api_key: apiKey,
      engine: 'google',
      hl: 'zh-cn',
      num: '3',
    })
    const response = await fetch(`https://serpapi.com/search?${params}`)
    if (!response.ok) return null

    const data = await response.json()
    // Extract knowledge graph if available
    const kg = data?.knowledge_graph
    if (kg) {
      const specs: Record<string, string> = {}
      for (const [key, value] of Object.entries(kg)) {
        if (typeof value === 'string') {
          specs[key] = value
        }
      }
      return specs
    }
    return null
  } catch {
    return null
  }
}

function getCategorySpecQuery(categoryId: string): string {
  const map: Record<string, string> = {
    phone: '规格 参数 处理器 屏幕 相机 电池',
    laptop: '规格 参数 处理器 内存 屏幕 显卡',
    headphone: '规格 参数 降噪 续航 驱动单元',
  }
  return map[categoryId] || '规格 参数'
}
