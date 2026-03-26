import { MODELS } from '../types'
import type { Message } from '../types'

// Simple markdown renderer — no external dependencies
function renderMarkdown(text: string): string {
  return text
    // Fenced code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Unordered lists (basic)
    .replace(/^[*\-] (.+)$/gm, '<li>$1</li>')
    // Line breaks → <br>
    .replace(/\n/g, '<br>')
    // Clean up <br> inside block elements
    .replace(/<br>(<\/(pre|h[123]|li)>)/g, '$1')
    .replace(/(<(pre|h[123]|li)>)<br>/g, '$1')
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
      {imageAttachments.length > 0 && (
        <div className="message-images">
          {imageAttachments.map((att) => (
            <img key={att.id} className="message-img" src={att.dataUrl} alt={att.name} title={att.name} />
          ))}
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="message-file-chips">
          {fileAttachments.map((att) => (
            <span key={att.id} className="file-chip">📄 {att.name}</span>
          ))}
        </div>
      )}

      {isError ? (
        <div className="bubble error">⚠️ {message.error}</div>
      ) : isUser ? (
        <div className="bubble">{message.content}</div>
      ) : (
        <div
          className="bubble"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: message.isSearching && !message.content
              ? '<span class="searching-indicator">Searching the web<span class="searching-dots"></span></span>'
              : (renderMarkdown(message.content) + (message.isStreaming ? '<span class="cursor"></span>' : '')),
          }}
        />
      )}

      <div className="bubble-meta">
        {!isUser && message.model && <span className="model-badge">{modelLabel(message.model)}</span>}
        {!isUser && message.model && <span>·</span>}
        <span>{relativeTime(message.timestamp)}</span>
      </div>
    </div>
  )
}
