import type { ModelId, Attachment } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'

// ─── Content block types ────────────────────────────────────────────────────

interface TextBlock {
  type: 'text'
  text: string
}

interface ImageBlock {
  type: 'image'
  source: {
    type: 'base64'
    media_type: string
    data: string
  }
}

interface DocumentBlock {
  type: 'document'
  source: {
    type: 'base64'
    media_type: 'application/pdf'
    data: string
  }
}

export type ContentBlock = TextBlock | ImageBlock | DocumentBlock

export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

interface StreamMessageParams {
  apiKey: string
  model: ModelId
  messages: ApiMessage[]
  webSearch: boolean
  onToken: (token: string) => void
  onSearching: () => void  // called when web_search tool starts
  onDone: () => void
  onError: (error: string) => void
  signal: AbortSignal
}

// ─── Helper: build API content from text + attachments ──────────────────────

export function buildApiContent(text: string, attachments?: Attachment[]): string | ContentBlock[] {
  if (!attachments || attachments.length === 0) {
    return text
  }

  const blocks: ContentBlock[] = []

  for (const att of attachments) {
    if (att.kind === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: att.mimeType,
          data: att.base64,
        },
      })
    } else if (att.kind === 'pdf') {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: att.base64,
        },
      })
    } else {
      // text file
      blocks.push({
        type: 'text',
        text: `[File: ${att.name}]\n\n${atob(att.base64)}`,
      })
    }
  }

  if (text) {
    blocks.push({ type: 'text', text })
  }

  return blocks
}

// ─── Error helpers ───────────────────────────────────────────────────────────

async function extractError(response: Response): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await response.json().catch(() => ({}))
  const msg: string = body?.error?.message ?? `HTTP ${response.status}`
  if (response.status === 401) return 'Invalid API key. Please check your key and try again.'
  if (response.status === 429) return 'Rate limit reached. Please wait a moment and try again.'
  return `API error (${response.status}): ${msg}`
}

// ─── Streaming path (no web search) ─────────────────────────────────────────

async function streamWithSSE(params: StreamMessageParams): Promise<void> {
  const { apiKey, model, messages, onToken, onSearching, onDone, onError, signal } = params

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      stream: true,
      messages,
    }),
    signal,
  })

  if (!response.ok) {
    onError(await extractError(response))
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (signal.aborted) break
    const { done, value } = await reader.read()
    if (done) break

    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event: any = JSON.parse(data)

        // Detect web_search tool starting
        if (
          event.type === 'content_block_start' &&
          event.content_block?.type === 'server_tool_use' &&
          !signal.aborted
        ) {
          onSearching()
        }

        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta' &&
          typeof event.delta.text === 'string' &&
          !signal.aborted
        ) {
          onToken(event.delta.text)
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  if (!signal.aborted) {
    onDone()
  }
}

// ─── Web search path (non-streaming, tool loop) ──────────────────────────────

async function streamWithWebSearch(params: StreamMessageParams): Promise<void> {
  const { apiKey, model, messages, onToken, onSearching, onDone, onError, signal } = params

  const workingMessages: ApiMessage[] = [...messages]
  const maxLoops = 5

  for (let i = 0; i < maxLoops; i++) {
    if (signal.aborted) return

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        stream: false,
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages: workingMessages,
      }),
      signal,
    })

    if (!response.ok) {
      onError(await extractError(response))
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await response.json()

    if (signal.aborted) return

    // Check if web search tool is being used
    if (result.stop_reason === 'pause_turn') {
      onSearching()
      // Append assistant message and continue loop
      workingMessages.push({ role: 'assistant', content: result.content })
      continue
    }

    // Extract text blocks and emit tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (result.content ?? []).filter((b: any) => b.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const block of textBlocks) {
      if (signal.aborted) return
      onToken(block.text)
    }

    onDone()
    return
  }

  // If we exhausted the loop, try to extract whatever text we have
  onDone()
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function streamMessage(params: StreamMessageParams): Promise<void> {
  if (params.signal.aborted) return

  try {
    if (params.webSearch) {
      await streamWithWebSearch(params)
    } else {
      await streamWithSSE(params)
    }
  } catch (err) {
    if (params.signal.aborted) return
    if (err instanceof Error && err.name === 'AbortError') return
    if (err instanceof Error) {
      params.onError(err.message)
    } else {
      params.onError('An unknown error occurred.')
    }
  }
}
