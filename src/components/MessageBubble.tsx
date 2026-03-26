import { MODELS } from '../types'
import type { Message } from '../types'

interface Props {
  message: Message
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isError = Boolean(message.error)

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`bubble ${isError ? 'error' : ''}`}>
        {isError ? (
          <>⚠️ {message.error}</>
        ) : (
          <>
            {message.content}
            {message.isStreaming && <span className="bubble-cursor" />}
          </>
        )}
      </div>
      <div className="bubble-meta">
        {!isUser && message.model && (
          <span className="bubble-model-badge">{modelLabel(message.model)}</span>
        )}
        <span>{relativeTime(message.timestamp)}</span>
      </div>
    </div>
  )
}
