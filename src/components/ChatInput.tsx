import { useRef, useState } from 'react'

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
  onStop: () => void
}

export default function ChatInput({ onSend, isLoading, onStop }: Props) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const el = ref.current
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
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div className="chat-input-area">
      <div className="chat-input-container">
        <textarea
          ref={ref}
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
            disabled={!text.trim()}
            title="Send (Enter)"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 12V3M3 7l4.5-4.5L12 7" />
            </svg>
          </button>
        )}
      </div>
      <p className="input-hint">Enter to send · Shift+Enter for newline</p>
    </div>
  )
}
