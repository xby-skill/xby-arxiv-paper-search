/**
 * xby-arxiv-paper-search — DeepSeek Harness OCR 插件
 *
 * 论文检索与解析工具
 * 一个基于arXiv的论文检索与内容解析工具，支持论文搜索、PDF链接获取和内容解析功能，适用于学术研究和AI领域的最新论文获取。
 *
 * # 使用方法
 *
 * 1. 安装插件：
 *    dsh plugin --profile web add xby-arxiv-paper-search
 *
 * 2. 在聊天中告诉 agent 你的 API 密钥：
 *    "我的小笨羊APIKEY是 xxx"
 *    agent 会自动调用 set_xby_apikey 工具保存密钥
 *
 * 3. 注册的工具：
 *    - set_xby_apikey     — 在聊天中设置 API 密钥（自动持久化）
 *    - search_arxiv   — 搜索 arXiv 论文
 *    - get_recent_ai_papers   — 获取 arXiv AI 领域最新论文（cs.AI/recent）
 *    - get_arxiv_pdf_url   — 获取 arXiv PDF 下载链接
 *    - parse_paper_content   — 解析论文内容（优先使用 HTML 版本，回退到 PDF）
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { DEFAULT_CONFIG } from './config.js'
import { callApi } from './api.js'

export const name = 'xby-arxiv-paper-search'

export const inject = ['tools']

/** 持久化文件路径 */
function apiKeyFilePath(): string {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(dshHome, 'storages', 'xby-apikey.json')
}

/** 从持久化文件读取 API 密钥 */
function loadPersistedApiKey(): string {
  try {
    const file = apiKeyFilePath()
    if (existsSync(file)) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as { apiKey: string }
      return data.apiKey || ''
    }
  } catch { /* 忽略读取错误 */ }
  return ''
}

/** 持久化保存 API 密钥 */
function persistApiKey(apiKey: string): void {
  try {
    const file = apiKeyFilePath()
    const dir = file.substring(0, file.lastIndexOf('/'))
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(file, JSON.stringify({ apiKey }, null, 2), 'utf-8')
  } catch { /* 忽略写入错误 */ }
}

export function apply(ctx: Context, config?: Record<string, any>) {
  const cfg: Record<string, any> = { ...DEFAULT_CONFIG, ...config }

  // 优先级：插件配置 > 持久化文件 > 环境变量
  if (!cfg.apiKey) cfg.apiKey = loadPersistedApiKey()
  if (!cfg.apiKey && typeof process !== 'undefined' && process.env?.XBY_APIKEY) {
    cfg.apiKey = process.env.XBY_APIKEY
  }

  // ── 工具 0: set_xby_apikey — 在聊天中设置 API 密钥 ──
  ctx.tools.register(
    defineTool({
      name: 'set_xby_apikey',
      description: '设置插件的 APIKEY。用户提供密钥后立即调用此工具保存，之后工具即可正常工作。密钥会被持久化，重启后仍然有效。',
      parameters: {
        apiKey: {
          type: 'string',
          required: true,
          description: '小笨羊 APIKEY',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (__args: Record<string, any>, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: Record<string, any>) {
        const apiKey = args.apiKey
        if (typeof apiKey !== 'string') {
              throw new Error('apiKey 必须是字符串')
        }
        cfg.apiKey = args.apiKey
        persistApiKey(apiKey)
        return 'APIKEY已设置并持久化保存，现在可以正常使用工具了。'
      },
    }),
  )

  // ── 工具 1: search_arxiv
  ctx.tools.register(
    defineTool({
      name: 'search_arxiv',
      description: '搜索 arXiv 论文',
      parameters: {
      query: {
          type: 'string',
          required: true,
          description: '搜索英文关键词',
        },
      maxResults: {
          type: 'number',
          description: '最大结果数量',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: Record<string, any>, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: Record<string, any>) {
        const result = await callApi(cfg, '1777316659949571', 'search_arxiv', args)
        if (!result.success) {
          throw new Error(result.message)
        }
        return result.text
      },
    }),
  )

  // ── 工具 2: get_recent_ai_papers
  ctx.tools.register(
    defineTool({
      name: 'get_recent_ai_papers',
      description: '获取 arXiv AI 领域最新论文（cs.AI/recent）',
      parameters: {
      },
      output: {
        schema: { type: 'string' },
        render: (_args: Record<string, any>, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: Record<string, any>) {
        const result = await callApi(cfg, '1777316659949571', 'get_recent_ai_papers', args)
        if (!result.success) {
          throw new Error(result.message)
        }
        return result.text
      },
    }),
  )

  // ── 工具 3: get_arxiv_pdf_url
  ctx.tools.register(
    defineTool({
      name: 'get_arxiv_pdf_url',
      description: '获取 arXiv PDF 下载链接',
      parameters: {
      input: {
          type: 'string',
          required: true,
          description: 'arXiv 论文URL（如：http://arxiv.org/abs/2403.15137v1）或 arXiv ID（如：2403.15137v1）',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: Record<string, any>, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: Record<string, any>) {
        const result = await callApi(cfg, '1777316659949571', 'get_arxiv_pdf_url', args)
        if (!result.success) {
          throw new Error(result.message)
        }
        return result.text
      },
    }),
  )

  // ── 工具 4: parse_paper_content
  ctx.tools.register(
    defineTool({
      name: 'parse_paper_content',
      description: '解析论文内容（优先使用 HTML 版本，回退到 PDF）',
      parameters: {
      input: {
          type: 'string',
          required: true,
          description: 'arXiv 论文URL或 arXiv ID',
        },
      paperInfo: {
          type: 'object',
          description: '论文信息（可选，用于添加论文元数据）',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: Record<string, any>, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: Record<string, any>) {
        const result = await callApi(cfg, '1777316659949571', 'parse_paper_content', args)
        if (!result.success) {
          throw new Error(result.message)
        }
        return result.text
      },
    }),
  )

  console.log(`[${name}] 插件已加载，注册了 5 个工具`)
}

// 支持对象形式导出
export default { name, inject, apply }
