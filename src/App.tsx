import { useEffect, useRef, useState } from 'react'
import type { Conversation, Message, ModelId, Attachment } from './types'
import { streamMessage, buildApiContent } from './anthropic'
import ApiKeyInput from './components/ApiKeyInput'
import ModelSelector from './components/ModelSelector'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import SettingsPanel from './components/SettingsPanel'
import Sidebar from './components/Sidebar'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Conversation helpers ────────────────────────────────────────────────────

  async function fetchConversations() {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) setConversations(await res.json())
    } catch { /* backend may not be up yet */ }
  }

  async function createConversation(): Promise<string | null> {
    try {
      const res = await fetch('/api/conversations', { method: 'POST' })
      if (!res.ok) return null
      const conv: Conversation = await res.json()
      setConversationId(conv.id)
      setConversations((prev) => [conv, ...prev])
      return conv.id
    } catch { return null }
  }

  async function saveConversation(id: string, msgs: Message[], firstUserText: string) {
    try {
      const title = firstUserText.slice(0, 45) || 'New Chat'
      await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, title }),
      })
      // Refresh list so sidebar shows updated title/time
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, title, updatedAt: Date.now() } : c)
      )
    } catch { /* non-critical */ }
  }

  async function startNewChat() {
    if (isLoading) return
    setMessages([])
    const id = await createConversation()
    if (id) setConversationId(id)
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (!res.ok) return
      const conv: Conversation = await res.json()
      setMessages(conv.messages ?? [])
      setConversationId(id)
    } catch { /* non-critical */ }
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (id === conversationId) {
        setMessages([])
        setConversationId(null)
        // Start a new one
        createConversation()
      }
    } catch { /* non-critical */ }
  }

  // On mount: load conversation list and create initial conversation
  useEffect(() => {
    fetchConversations().then(() => {
      createConversation()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Error banner ────────────────────────────────────────────────────────────

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    setErrorBanner(msg)
    errorTimerRef.current = setTimeout(() => setErrorBanner(null), 8000)
  }

  // ── Settings helpers ────────────────────────────────────────────────────────

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

  // ── Stop ───────────────────────────────────────────────────────────────────

  function handleStop() {
    abortRef.current?.abort()
    setIsLoading(false)
    setMessages((prev) =>
      prev.map((m) => m.isStreaming ? { ...m, isStreaming: false, isSearching: false } : m),
    )
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  async function handleSend(text: string, attachments: Attachment[]) {
    if (isLoading) return

    // Ensure we always have a conversation to save into
    let activeConvId = conversationId
    if (!activeConvId) {
      activeConvId = await createConversation()
    }

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
      content: m.role === 'user' ? buildApiContent(m.content, m.attachments) : m.content,
    }))

    // Track tokens so we can save the completed response
    let responseText = ''

    const finalize = (error?: string) => {
      const finalMsgs = [...history, {
        ...assistantMsg,
        content: responseText,
        isStreaming: false,
        isSearching: false,
        ...(error ? { error } : {}),
      }]
      setMessages(finalMsgs)
      setIsLoading(false)
      if (error) showError(error)
      // Save to backend (non-blocking)
      if (activeConvId) saveConversation(activeConvId, finalMsgs, text)
    }

    try {
      await streamMessage({
        apiKey,
        model: selectedModel,
        systemPrompt: systemPrompt || undefined,
        messages: apiMessages,
        webSearch,
        onToken: (token) => {
          responseText += token
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + token } : m),
          )
        },
        onSearching: () => {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, isSearching: true } : m),
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

  function handleSuggestion(text: string) { handleSend(text, []) }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!apiKey) return <ApiKeyInput onSave={handleSaveKey} />

  return (
    <div className="app">
      <header className="header">
        {/* Hamburger — opens conversation sidebar */}
        <button
          className="header-hamburger"
          onClick={() => { fetchConversations(); setSidebarOpen(true) }}
          title="Chats"
          aria-label="Open conversations"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 5h12M3 9h12M3 13h12" />
          </svg>
        </button>

        <div className="header-logo">
          <div className="header-logo-icon">✦</div>
          <span className="header-title">Claude Chat</span>
        </div>

        <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={isLoading} />
        <div className="header-spacer" />

        {/* Settings gear */}
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

      {errorBanner && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon">⚠️</span>
          <span className="error-banner-msg">{errorBanner}</span>
          <button className="error-banner-close" onClick={() => setErrorBanner(null)}>✕</button>
        </div>
      )}

      {isLoading && <div className="progress-bar" />}

      <MessageList messages={messages} onSuggestion={handleSuggestion} />

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
        onClearMessages={() => { setMessages([]); if (conversationId) saveConversation(conversationId, [], '') }}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={conversationId}
        onNewChat={startNewChat}
        onSelect={loadConversation}
        onDelete={deleteConversation}
      />
    </div>
  )
}
