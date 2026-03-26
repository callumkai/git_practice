import { useRef, useState } from 'react'
import type { Message, ModelId } from './types'
import { streamMessage } from './anthropic'
import ApiKeyInput from './components/ApiKeyInput'
import ModelSelector from './components/ModelSelector'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'

export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('anthropic_api_key') ?? '',
  )
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-opus-4-6')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function handleSaveKey(key: string) {
    localStorage.setItem('anthropic_api_key', key)
    setApiKey(key)
  }

  function handleClearKey() {
    localStorage.removeItem('anthropic_api_key')
    setApiKey('')
    setMessages([])
  }

  function handleStop() {
    abortRef.current?.abort()
    setIsLoading(false)
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    )
  }

  function handleSuggestion(text: string) {
    handleSend(text)
  }

  async function handleSend(text: string) {
    if (isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      isStreaming: false,
      timestamp: Date.now(),
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      model: selectedModel,
      timestamp: Date.now(),
    }

    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    await streamMessage({
      apiKey,
      model: selectedModel,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        )
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m,
          ),
        )
        setIsLoading(false)
      },
      onError: (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false, error } : m,
          ),
        )
        setIsLoading(false)
      },
      signal: controller.signal,
    })
  }

  if (!apiKey) return <ApiKeyInput onSave={handleSaveKey} />

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">✦</div>
          <span className="header-title">Claude Chat</span>
        </div>
        <ModelSelector
          value={selectedModel}
          onChange={setSelectedModel}
          disabled={isLoading}
        />
        <div className="header-spacer" />
        <button className="header-key-btn" onClick={handleClearKey}>
          API Key
        </button>
      </header>

      <MessageList
        messages={messages}
        onSuggestion={handleSuggestion}
      />

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        onStop={handleStop}
      />
    </div>
  )
}
