import type { CategoryTemplate } from './templates'

interface ExtractionOptions {
  productName: string
  template: CategoryTemplate
  rawContent: string
}

interface ExtractionResult {
  success: boolean
  specs: Record<string, string>
  fullModelName?: string
  error?: string
}

/**
 * 调用 DeepSeek API 从产品页面内容中提取结构化参数
 */
export async function extractWithAI(options: ExtractionOptions): Promise<ExtractionResult> {
  const { productName, template, rawContent } = options
  const apiKey = process.env.DEEPSEEK_API_KEY || ''

  if (!apiKey) {
    return {
      success: false,
      specs: {},
      error: '未配置 DEEPSEEK_API_KEY 环境变量',
    }
  }

  const fieldsDescription = template.sections
    .map(s =>
      `【${s.label}】\n` +
      s.fields.map(f => `  - ${f.key} (${f.label}${f.unit ? `，单位: ${f.unit}` : ''})`).join('\n')
    )
    .join('\n')

  const hasContent = rawContent && rawContent.trim().length > 20 && !rawContent.includes('请根据您对')

  const totalFields = template.sections.reduce((sum, s) => sum + s.fields.length, 0)

  const systemPrompt = `你是一个产品参数专家。${hasContent ? '从给定的产品信息中提取' : '根据你的知识直接提供'}指定产品的结构化参数数据。

产品品类：${template.name}
需要提取的字段（共${totalFields}项）：
${fieldsDescription}

### 重要：品类验证规则
首先判断 "${productName}" 是否属于「${template.name}」品类。
- 如果属于该品类，正常提取所有参数
- 如果**不属于**该品类（例如：品类是"手机"但产品是"MacBook Pro"），则将 _categoryValid 设为 false，其它字段留空
- 如果品类是笔记本/电脑，键盘/鼠标/U盘等外设不算笔记本
- 如果品类是耳机，音箱/麦克风不算耳机
- 如果品类是显示器，笔记本/电视不算显示器
- 如果品类是鼠标，触摸板/手柄/键盘不算鼠标
- 如果品类是键盘，鼠标/手柄不算键盘

### JSON 输出格式
{
  "_categoryValid": true或false,
  "_fullModelName": "产品的完整准确型号名称（如 Apple iPhone 16 Pro Max A3296）",
  "其他所有参数字段..."
}

规则：
1. ${hasContent ? '从提供的产品信息中提取最准确的值' : '根据你的知识直接填写最准确的参数'}
2. **尽量填写每一个字段**，即使是估计值也要填写，不要留空
3. 值只保留最核心的信息，不要解释性文字
4. 单位统一（如 mm、g、英寸、Hz、mAh、W 等）
5. 别名字段自动匹配（如 "处理器" → chipset, "屏幕" → screenSize 等）`

  const userPrompt = hasContent
    ? `产品名称：${productName}\n\n参考信息：\n${rawContent.slice(0, 8000)}`
    : `产品名称：${productName}\n请提供该产品的${totalFields}项参数数据，用JSON格式返回。`

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        success: false,
        specs: {},
        error: `DeepSeek API 错误 (${response.status}): ${errorBody}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const raw = JSON.parse(content) as Record<string, any>

    // Check category validation
    const categoryValid = raw._categoryValid !== false
    const fullModelName = String(raw._fullModelName || productName)
    delete raw._categoryValid
    delete raw._fullModelName

    if (!categoryValid) {
      return {
        success: false,
        specs: {},
        error: `"${productName}" 不是「${template.name}」品类，请先切换品类或检查产品名称`,
      }
    }

    const specs = raw as Record<string, string>

    // Check if most fields are empty (possible failed extraction)
    const filledCount = Object.values(specs).filter(v => v !== '' && v !== undefined).length
    if (totalFields > 3 && filledCount < 2) {
      return {
        success: false,
        specs: {},
        error: `未能获取到 "${productName}" 的参数数据，请检查产品名称是否正确`,
      }
    }

    return { success: true, specs, fullModelName }
  } catch (err) {
    return {
      success: false,
      specs: {},
      error: `AI 提取失败: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
