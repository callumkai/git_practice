import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { MODELS } from '../types'
import type { Message } from '../types'

marked.setOptions({ breaks: true })

function renderMarkdown(text: string): string {
  const html = marked.parse(text) as string
  return DOMPurify.sanitize(html)
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label.replace('Claude ', '') ?? id
}

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isError = Boolean(message.error)
  const imageAttachments = message.attachments?.filter((a) => a.kind === 'image') ?? []
  const fileAttachments = message.attachments?.filter((a) => a.kind !== 'image') ?? []

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      {/* Image thumbnails above bubble */}
      {imageAttachments.length > 0 && (
        <div className="message-images">
          {imageAttachments.map((att) => (
            <img
              key={att.id}
              className="message-img"
              src={att.dataUrl}
              alt={att.name}
              title={att.name}
            />
          ))}
        </div>
      )}

      {/* File attachment chips above bubble */}
      {fileAttachments.length > 0 && (
        <div className="message-file-chips">
          {fileAttachments.map((att) => (
            <span key={att.id} className="file-chip">
              📄 {att.name}
            </span>
          ))}
        </div>
      )}

      {isError ? (
        <div className="bubble error">⚠️ {message.error}</div>
      ) : isUser ? (
        <div className="bubble">{message.content}</div>
      ) : message.isSearching && !message.content ? (
        <div className="bubble">
          <span className="searching-indicator">Searching the web<span className="searching-dots"></span></span>
        </div>
      ) : (
        <div
          className="bubble"
          dangerouslySetInnerHTML={{
            __html:
              message.content
                ? renderMarkdown(message.content) + (message.isStreaming ? '<span class="cursor"></span>' : '')
                : (message.isSearching
                    ? '<span class="searching-indicator">Searching the web<span class="searching-dots"></span></span>'
                    : '<span class="cursor"></span>'),
          }}
        />
      )}
      <div className="bubble-meta">
        {!isUser && message.model && (
          <span className="model-badge">{modelLabel(message.model)}</span>
        )}
        {!isUser && message.model && <span>·</span>}
        <span>{relativeTime(message.timestamp)}</span>
      </div>
    </div>
  )
}
