import { useRef, useState } from 'react'
import type { Message, ModelId, Attachment } from './types'
import { streamMessage, buildApiContent } from './anthropic'
import ApiKeyInput from './components/ApiKeyInput'
import ModelSelector from './components/ModelSelector'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('anthropic_api_key') ?? '',
  )
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    () => (localStorage.getItem('default_model') as ModelId | null) ?? 'claude-opus-4-6',
  )
  const [systemPrompt, setSystemPrompt] = useState<string>(
    () => localStorage.getItem('system_prompt') ?? '',
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    setErrorBanner(msg)
    errorTimerRef.current = setTimeout(() => setErrorBanner(null), 8000)
  }

  function handleSaveKey(key: string) {
    localStorage.setItem('anthropic_api_key', key)
    setApiKey(key)
  }

  function handleDeleteKey() {
    localStorage.removeItem('anthropic_api_key')
    setApiKey('')
    setMessages([])
  }

  function handleDefaultModelChange(m: ModelId) {
    localStorage.setItem('default_model', m)
    setSelectedModel(m)
  }

  function handleSystemPromptChange(prompt: string) {
    localStorage.setItem('system_prompt', prompt)
    setSystemPrompt(prompt)
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
      if (error) showError(error)
    }

    try {
      await streamMessage({
        apiKey,
        model: selectedModel,
        systemPrompt: systemPrompt || undefined,
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
        <button
          className="header-menu-btn"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          aria-label="Open settings"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="9" r="2.2" />
            <path d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.6 3.6l1.27 1.27M13.13 13.13l1.27 1.27M14.4 3.6l-1.27 1.27M4.87 13.13l-1.27 1.27" />
          </svg>
        </button>
      </header>

      {/* Error banner — shown whenever an API error occurs */}
      {errorBanner && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon">⚠️</span>
          <span className="error-banner-msg">{errorBanner}</span>
          <button className="error-banner-close" onClick={() => setErrorBanner(null)} title="Dismiss">✕</button>
        </div>
      )}

      {/* Loading progress bar */}
      {isLoading && <div className="progress-bar" />}

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

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveKey}
        onDeleteKey={handleDeleteKey}
        systemPrompt={systemPrompt}
        onSystemPromptChange={handleSystemPromptChange}
        defaultModel={selectedModel}
        onDefaultModelChange={handleDefaultModelChange}
        onClearMessages={() => setMessages([])}
      />
    </div>
  )
}
