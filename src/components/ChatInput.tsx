import { useRef, useState } from 'react'

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
  onStop: () => void
}

export default function ChatInput({ onSend, isLoading, onStop }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function adjustHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    adjustHeight()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const canSend = text.trim().length > 0 && !isLoading

  return (
    <div className="chat-input-area">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder={isLoading ? 'Waiting for response…' : 'Message Claude… (Enter to send, Shift+Enter for newline)'}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        {isLoading ? (
          <button className="stop-btn" onClick={onStop} title="Stop generation">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={submit}
            disabled={!canSend}
            title="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1.5l13 6.5-13 6.5V9.5l9-2-9-2V1.5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
