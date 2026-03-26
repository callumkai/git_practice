import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

const SUGGESTIONS = [
  'Explain quantum computing',
  'Write a Python web scraper',
  'Help me debug my code',
  'Summarize an article',
]

interface Props {
  messages: Message[]
  onSuggestion: (text: string) => void
}

export default function MessageList({ messages, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <h2>Claude Chat</h2>
          <p>Powered by Anthropic. Ask anything.</p>
          <div className="suggestion-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => onSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
