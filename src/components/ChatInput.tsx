import { useRef, useState } from 'react'
import type { Attachment } from '../types'

interface Props {
  onSend: (text: string, attachments: Attachment[]) => void
  isLoading: boolean
  onStop: () => void
  webSearch: boolean
  onWebSearchToggle: () => void
}

export default function ChatInput({ onSend, isLoading, onStop, webSearch, onWebSearchToggle }: Props) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    resize()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = text.trim()
    if ((!trimmed && attachments.length === 0) || isLoading) return
    onSend(trimmed, attachments)
    setText('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleAttachClick() {
    fileInputRef.current?.click()
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl.split(',')[1] ?? ''
        const mimeType = file.type || 'text/plain'

        let kind: 'image' | 'pdf' | 'text'
        if (mimeType.startsWith('image/')) {
          kind = 'image'
        } else if (mimeType === 'application/pdf') {
          kind = 'pdf'
        } else {
          kind = 'text'
        }

        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          kind,
          mimeType,
          dataUrl,
          base64,
          size: file.size,
        }
        setAttachments((prev) => [...prev, attachment])
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isLoading

  return (
    <div className="chat-input-area">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,text/markdown,text/csv,text/javascript,text/typescript,.ts,.tsx,.py,.md,.csv,.json,.txt"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="attach-preview">
          {attachments.map((att) => (
            <div key={att.id} className="attach-chip">
              {att.kind === 'image' ? (
                <img src={att.dataUrl} alt={att.name} />
              ) : (
                <span>📄</span>
              )}
              <span className="attach-chip-name">{att.name}</span>
              <button
                className="attach-chip-remove"
                onClick={() => removeAttachment(att.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Message…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          autoComplete="off"
          autoCorrect="on"
          spellCheck
        />
        {isLoading ? (
          <button className="chat-btn stop-btn" onClick={onStop} title="Stop">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            className="chat-btn send-btn"
            onClick={submit}
            disabled={!canSend}
            title="Send (Enter)"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 12V3M3 7l4.5-4.5L12 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="chat-toolbar">
        <button
          className="toolbar-btn"
          onClick={handleAttachClick}
          disabled={isLoading}
          title="Attach file"
        >
          📎 Attach
        </button>
        <button
          className={`toolbar-btn${webSearch ? ' active' : ''}`}
          onClick={onWebSearchToggle}
          disabled={isLoading}
          title="Toggle web search"
        >
          🌐 Web Search {webSearch ? 'ON' : 'OFF'}
        </button>
      </div>

      <p className="input-hint">Enter to send · Shift+Enter for newline</p>
    </div>
  )
}
