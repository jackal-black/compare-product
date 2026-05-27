# 参数对兑 — 产品参数对比工具

> 最后一步，比清楚再买。

一个简洁的**工具类网站**，帮助用户在产品购买的最终决策阶段，对比 2-4 款产品的详细参数。

## 核心理念

- 🛠 **工具而非内容** — 没有首页推送、资讯、评测文章
- ⚡ **两步完成** — 搜索产品 → AI 自动提取参数并对比
- 🧩 **品类自适应** — 选择手机/笔记本/耳机等品类，自动切换参数模板
- 🎯 **差异高亮** — 有差异的参数行自动标记，一眼看出区别

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript + Nuxt 3 |
| 样式 | TailwindCSS |
| 后端 | Nuxt Nitro Server |
| AI 提取 | DeepSeek API |
| 搜索 | SerpAPI (可选) |

## 快速开始

```bash
# 1. 进入项目目录
cd product-compare

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

开发服务器默认运行在 http://localhost:3000

## 项目结构

```
product-compare/
├── app.vue                  # 根组件
├── pages/index.vue          # 首页（搜索 + 对比）
├── components/
│   ├── SearchBox.vue        # 搜索输入框
│   ├── ProductCard.vue      # 产品卡片
│   └── CompareTable.vue     # 对比表格（核心）
├── composables/
│   └── useCompare.ts        # 对比逻辑（状态管理）
├── server/
│   ├── api/
│   │   ├── categories.get.ts   # 品类列表
│   │   ├── search.post.ts      # 搜索产品
│   │   └── extract.post.ts     # AI 提取参数
│   ├── data/templates/         # 品类参数模板
│   │   ├── phone.json          # 手机模板
│   │   ├── laptop.json         # 笔记本模板
│   │   └── headphone.json      # 耳机模板
│   └── utils/
│       ├── templates.ts        # 模板加载器
│       ├── ai-extract.ts       # DeepSeek API 调用
│       └── search.ts           # 搜索 + 网页抓取
└── nuxt.config.ts           # Nuxt 配置
```

## 添加新品类

1. 在 `server/data/templates/` 下创建 JSON 文件
2. 在 `server/utils/templates.ts` 的 `templates` 对象中注册
3. 重启开发服务器即可

## 部署

```bash
npm run build
node .output/server/index.mjs
```
