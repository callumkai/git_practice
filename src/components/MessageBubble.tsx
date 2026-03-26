import { MODELS } from '../types'
import type { Message } from '../types'

// ─── HTML helpers ────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Markdown renderer (no external deps) ────────────────────────────────────
// Extracts code blocks first (to preserve verbatim content), HTML-escapes
// the rest, then applies markdown transforms.

function renderMarkdown(raw: string): string {
  if (!raw) return ''

  // 1. Extract fenced code blocks → placeholder
  const codeBlocks: string[] = []
  let text = raw.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const body = escapeHtml(code.replace(/\n$/, ''))
    const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
    codeBlocks.push(`<pre><code${cls}>${body}</code></pre>`)
    return `\x02CB${codeBlocks.length - 1}\x03`
  })

  // 2. Extract inline code → placeholder
  const inlineCodes: string[] = []
  text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`)
    return `\x02IC${inlineCodes.length - 1}\x03`
  })

  // 3. HTML-escape remaining text (safe to insert HTML tags after this)
  text = escapeHtml(text)

  // 4. Markdown transforms
  text = text
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![*])\*([^*\n]+)\*(?![*])/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^(&gt;) (.+)$/gm, '<blockquote>$2</blockquote>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/^---+$/gm, '<hr>')
    // Markdown links [text](url) — url was already escaped so (&amp; etc are fine)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\n]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    // Bare URLs
    .replace(/(^|[\s(])(https?:\/\/[^\s<&"')\]]+)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>')
    .replace(/\n/g, '<br>')
    // Tidy <br> around block elements
    .replace(/<br>(<\/(pre|h[1-3]|li|blockquote|hr)>)/g, '$1')
    .replace(/(<(pre|h[1-3]|li|blockquote)>)<br>/g, '$1')

  // 5. Restore placeholders
  codeBlocks.forEach((b, i) => { text = text.split(`\x02CB${i}\x03`).join(b) })
  inlineCodes.forEach((c, i) => { text = text.split(`\x02IC${i}\x03`).join(c) })

  return text
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isError = Boolean(message.error)
  const imageAttachments = message.attachments?.filter((a) => a.kind === 'image') ?? []
  const fileAttachments = message.attachments?.filter((a) => a.kind !== 'image') ?? []

  function assistantHtml(): string {
    if (message.isSearching && !message.content) {
      return '<span class="searching-indicator">Searching the web<span class="searching-dots"></span></span>'
    }
    const md = renderMarkdown(message.content)
    return message.isStreaming ? md + '<span class="cursor"></span>' : md
  }

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
        <div className="bubble">{message.content || <span style={{ opacity: 0.4 }}>(empty)</span>}</div>
      ) : (
        <div
          className="bubble"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: assistantHtml() }}
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
