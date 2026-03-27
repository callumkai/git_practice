import type { ModelId, Attachment } from './types'

const API_URL = '/api/messages'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TextBlock     { type: 'text'; text: string }
interface ImageBlock    { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
interface DocumentBlock { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

export type ContentBlock = TextBlock | ImageBlock | DocumentBlock

export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

interface StreamMessageParams {
  apiKey: string
  model: ModelId
  systemPrompt?: string
  messages: ApiMessage[]
  webSearch: boolean
  onToken: (token: string) => void
  onSearching: () => void
  onDone: () => void
  onError: (error: string) => void
  signal: AbortSignal
}

// ─── Build API content ────────────────────────────────────────────────────────

export function buildApiContent(text: string, attachments?: Attachment[]): string | ContentBlock[] {
  if (!attachments || attachments.length === 0) return text

  const blocks: ContentBlock[] = []

  for (const att of attachments) {
    if (att.kind === 'image') {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: att.mimeType, data: att.base64 } })
    } else if (att.kind === 'pdf') {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: att.base64 } })
    } else {
      let content = ''
      try { content = atob(att.base64) } catch { content = '(unreadable)' }
      blocks.push({ type: 'text', text: `[File: ${att.name}]\n\n${content}` })
    }
  }

  if (text) blocks.push({ type: 'text', text })

  return blocks
}

// ─── Shared request headers ───────────────────────────────────────────────────

function makeHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    // anthropic-version is added by the backend proxy, not needed here
  }
}

// ─── Error extractor ─────────────────────────────────────────────────────────

async function extractError(res: Response): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await res.json().catch(() => ({}))
  const msg: string = body?.error?.message ?? `HTTP ${res.status}`
  if (res.status === 401) return 'Invalid API key — click "API Key" and re-enter it.'
  if (res.status === 403) return `Access denied (403): ${msg}`
  if (res.status === 404) return `Model not found (404): ${msg}`
  if (res.status === 429) return 'Rate limit reached — please wait a moment and try again.'
  if (res.status >= 500) return `Anthropic server error (${res.status}) — try again later.`
  return `API error (${res.status}): ${msg}`
}

// ─── SSE streaming path ───────────────────────────────────────────────────────

async function streamWithSSE(p: StreamMessageParams): Promise<void> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: makeHeaders(p.apiKey),
    body: JSON.stringify({ model: p.model, max_tokens: 8192, stream: true, messages: p.messages, ...(p.systemPrompt ? { system: p.systemPrompt } : {}) }),
    signal: p.signal,
  })

  if (!res.ok) { p.onError(await extractError(res)); return }
  if (!res.body) { p.onError('No response body from API.'); return }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (p.signal.aborted) return

      buf += decoder.decode(value, { stream: true })

      // SSE lines can be \n or \r\n separated
      const lines = buf.split(/\r?\n/)
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ev: any = JSON.parse(data)

          if (ev.type === 'error') {
            p.onError(ev.error?.message ?? 'Stream error from API.')
            return
          }

          // Server-side tool use starting (web_search mid-stream)
          if (ev.type === 'content_block_start' && ev.content_block?.type === 'server_tool_use') {
            p.onSearching()
          }

          if (
            ev.type === 'content_block_delta' &&
            ev.delta?.type === 'text_delta' &&
            typeof ev.delta.text === 'string'
          ) {
            p.onToken(ev.delta.text)
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (!p.signal.aborted) p.onDone()
}

// ─── Web-search path (non-streaming tool loop) ───────────────────────────────

async function streamWithWebSearch(p: StreamMessageParams): Promise<void> {
  const working: ApiMessage[] = [...p.messages]
  const MAX_LOOPS = 6

  for (let i = 0; i < MAX_LOOPS; i++) {
    if (p.signal.aborted) return

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: makeHeaders(p.apiKey),
      body: JSON.stringify({
        model: p.model,
        max_tokens: 8192,
        stream: false,
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages: working,
        ...(p.systemPrompt ? { system: p.systemPrompt } : {}),
      }),
      signal: p.signal,
    })

    if (!res.ok) { p.onError(await extractError(res)); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await res.json()
    if (p.signal.aborted) return

    if (result.stop_reason === 'pause_turn') {
      // Server is executing the web search — append assistant turn and loop
      p.onSearching()
      working.push({ role: 'assistant', content: result.content })
      continue
    }

    // Final response — emit text blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks: any[] = (result.content ?? []).filter((b: any) => b.type === 'text')
    for (const block of textBlocks) {
      if (p.signal.aborted) return
      p.onToken(String(block.text ?? ''))
    }

    p.onDone()
    return
  }

  // Exhausted retries — call onDone so the UI doesn't freeze
  p.onDone()
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function streamMessage(p: StreamMessageParams): Promise<void> {
  if (p.signal.aborted) return
  try {
    if (p.webSearch) await streamWithWebSearch(p)
    else await streamWithSSE(p)
  } catch (err) {
    if (p.signal.aborted) return
    if (err instanceof Error && err.name === 'AbortError') return
    p.onError(err instanceof Error ? err.message : 'An unknown error occurred.')
  }
}
