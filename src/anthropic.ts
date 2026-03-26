import Anthropic from '@anthropic-ai/sdk'
import type { ModelId, MessageRole } from './types'

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

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const stream = client.messages.stream(
      {
        model,
        max_tokens: 8192,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal },
    )

    stream.on('text', (text) => {
      if (!signal.aborted) onToken(text)
    })

    await stream.finalMessage()

    if (!signal.aborted) {
      onDone()
    }
  } catch (err) {
    if (signal.aborted) return
    if (err instanceof Anthropic.APIError) {
      if (err instanceof Anthropic.AuthenticationError) {
        onError('Invalid API key. Please check your key and try again.')
      } else if (err instanceof Anthropic.RateLimitError) {
        onError('Rate limit reached. Please wait a moment and try again.')
      } else {
        onError(`API error (${err.status}): ${err.message}`)
      }
    } else if (err instanceof Error) {
      onError(err.message)
    } else {
      onError('An unknown error occurred.')
    }
  }
}
