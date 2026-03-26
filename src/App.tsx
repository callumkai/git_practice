import { useRef, useState } from 'react'
import type { Message, ModelId, Attachment } from './types'
import { streamMessage, buildApiContent } from './anthropic'
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
  const [webSearch, setWebSearch] = useState(false)
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
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false, isSearching: false } : m)),
    )
  }

  function handleSuggestion(text: string) {
    handleSend(text, [])
  }

  async function handleSend(text: string, attachments: Attachment[]) {
    if (isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      isStreaming: false,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      model: selectedModel,
      timestamp: Date.now(),
      isSearching: webSearch,
    }

    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    // Build API messages from history
    const apiMessages = history.map((m) => ({
      role: m.role,
      content: m.role === 'user'
        ? buildApiContent(m.content, m.attachments)
        : m.content,
    }))

    const finalize = (error?: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, isSearching: false, ...(error ? { error } : {}) }
            : m,
        ),
      )
      setIsLoading(false)
    }

    try {
      await streamMessage({
        apiKey,
        model: selectedModel,
        messages: apiMessages,
        webSearch,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m,
            ),
          )
        },
        onSearching: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isSearching: true } : m,
            ),
          )
        },
        onDone: () => finalize(),
        onError: (error) => finalize(error),
        signal: controller.signal,
      })
    } catch (err) {
      // Safety net: should not reach here since streamMessage handles all errors
      if (!controller.signal.aborted) {
        finalize(err instanceof Error ? err.message : 'Unexpected error')
      }
    }
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
        webSearch={webSearch}
        onWebSearchToggle={() => setWebSearch((v) => !v)}
      />
    </div>
  )
}
