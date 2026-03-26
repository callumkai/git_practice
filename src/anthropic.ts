import type { ModelId, MessageRole } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'

interface StreamMessageParams {
  apiKey: string
  model: ModelId
  messages: { role: MessageRole; content: string }[]
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: string) => void
  signal: AbortSignal
}

export async function streamMessage({
  apiKey,
  model,
  messages,
  onToken,
  onDone,
  onError,
  signal,
}: StreamMessageParams): Promise<void> {
  if (signal.aborted) return

  try {
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
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal,
    })

    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = await response.json().catch(() => ({}))
      const msg: string = body?.error?.message ?? `HTTP ${response.status}`
      if (response.status === 401) {
        onError('Invalid API key. Please check your key and try again.')
      } else if (response.status === 429) {
        onError('Rate limit reached. Please wait a moment and try again.')
      } else {
        onError(`API error (${response.status}): ${msg}`)
      }
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
  } catch (err) {
    if (signal.aborted) return
    if (err instanceof Error) {
      onError(err.message)
    } else {
      onError('An unknown error occurred.')
    }
  }
}
