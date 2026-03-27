import { useState } from 'react'
import { MODELS } from '../types'
import type { ModelId } from '../types'

export const APP_VERSION = '1.2.0'

const API_URL = '/api/messages'

interface Props {
  open: boolean
  onClose: () => void
  apiKey: string
  onSaveKey: (key: string) => void
  onDeleteKey: () => void
  systemPrompt: string
  onSystemPromptChange: (v: string) => void
  defaultModel: ModelId
  onDefaultModelChange: (m: ModelId) => void
  onClearMessages: () => void
}

export default function SettingsPanel({
  open,
  onClose,
  apiKey,
  onSaveKey,
  onDeleteKey,
  systemPrompt,
  onSystemPromptChange,
  defaultModel,
  onDefaultModelChange,
  onClearMessages,
}: Props) {
  const [editingKey, setEditingKey] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [promptDraft, setPromptDraft] = useState(systemPrompt)
  const [promptSaved, setPromptSaved] = useState(false)

  // Test connection state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testDetail, setTestDetail] = useState('')

  function maskedKey() {
    if (!apiKey) return '—'
    return apiKey.slice(0, 10) + '••••••••••••' + apiKey.slice(-4)
  }

  function startEditKey() {
    setKeyDraft('')
    setKeyError('')
    setShowKey(false)
    setEditingKey(true)
  }

  function saveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setKeyError('Key must start with "sk-ant-"')
      return
    }
    onSaveKey(trimmed)
    setEditingKey(false)
    setKeyError('')
    // Re-test after saving
    setTestStatus('idle')
    setTestDetail('')
  }

  function savePrompt() {
    onSystemPromptChange(promptDraft)
    setPromptSaved(true)
    setTimeout(() => setPromptSaved(false), 1800)
  }

  async function testConnection() {
    setTestStatus('testing')
    setTestDetail('')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = await res.json().catch(() => ({}))
      if (res.ok) {
        setTestStatus('ok')
        setTestDetail('API key is valid and working.')
      } else {
        setTestStatus('fail')
        const msg = body?.error?.message ?? `HTTP ${res.status}`
        if (res.status === 401) setTestDetail('Invalid API key. Please update it.')
        else if (res.status === 403) setTestDetail(`Access denied: ${msg}`)
        else if (res.status === 404) setTestDetail(`Model not found: ${msg}`)
        else if (res.status === 429) setTestDetail('Rate limit hit — try again shortly.')
        else setTestDetail(`Error ${res.status}: ${msg}`)
      }
    } catch (err) {
      setTestStatus('fail')
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setTestDetail('Network error — check your internet connection. (CORS may also be blocking the request in some browsers.)')
      } else {
        setTestDetail(msg)
      }
    }
  }

  function confirmClear() {
    if (window.confirm('Clear all messages in this conversation?')) {
      onClearMessages()
      onClose()
    }
  }

  function confirmDelete() {
    if (window.confirm('Remove API key? You will need to enter it again.')) {
      onDeleteKey()
      onClose()
    }
  }

  return (
    <>
      {open && <div className="settings-backdrop" onClick={onClose} />}

      <div className={`settings-drawer${open ? ' open' : ''}`}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="settings-body">

          {/* ── About ─────────────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-about-card">
              <div className="settings-about-icon">✦</div>
              <div>
                <div className="settings-about-name">Claude Chat</div>
                <div className="settings-about-version">Version {APP_VERSION}</div>
              </div>
            </div>
            <p className="settings-about-desc">
              Powered by Anthropic. Your key is stored locally and sent directly to Anthropic — never to any other server.
            </p>
          </section>

          {/* ── API Key ───────────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-section-title">API Key</div>

            {editingKey ? (
              <div className="settings-key-edit">
                <div className="settings-key-input-row">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-ant-..."
                    value={keyDraft}
                    onChange={(e) => { setKeyDraft(e.target.value); setKeyError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                    autoFocus
                    autoComplete="off"
                    className="settings-input"
                  />
                  <button className="settings-icon-btn" onClick={() => setShowKey((v) => !v)} title={showKey ? 'Hide' : 'Show'}>
                    {showKey ? '🙈' : '👁'}
                  </button>
                </div>
                {keyError && <div className="settings-field-error">{keyError}</div>}
                <div className="settings-row-btns">
                  <button className="settings-btn primary" onClick={saveKey}>Save key</button>
                  <button className="settings-btn ghost" onClick={() => { setEditingKey(false); setKeyError('') }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="settings-key-row">
                <span className="settings-key-masked">{maskedKey()}</span>
                <div className="settings-row-btns">
                  <button className="settings-btn ghost" onClick={startEditKey}>Change</button>
                  <button className="settings-btn danger-ghost" onClick={confirmDelete}>Remove</button>
                </div>
              </div>
            )}

            <p className="settings-help">
              Get your key at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>
            </p>
          </section>

          {/* ── Test Connection ────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-section-title">Connection</div>
            <p className="settings-help" style={{ marginBottom: 10 }}>
              Send a test request to verify your key and network connection.
            </p>
            <button
              className="settings-btn primary"
              onClick={testConnection}
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing…' : 'Test API Key'}
            </button>
            {testStatus === 'ok' && (
              <div className="settings-test-result ok">✓ {testDetail}</div>
            )}
            {testStatus === 'fail' && (
              <div className="settings-test-result fail">✗ {testDetail}</div>
            )}
          </section>

          {/* ── Default Model ─────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-section-title">Default Model</div>
            <div className="settings-model-grid">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`settings-model-card${defaultModel === m.id ? ' active' : ''}`}
                  onClick={() => onDefaultModelChange(m.id)}
                >
                  <span className="settings-model-name">{m.label}</span>
                  <span className="settings-model-desc">{m.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── System Prompt ─────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-section-title">System Prompt</div>
            <p className="settings-help" style={{ marginBottom: 8 }}>
              Custom instructions sent to Claude before every conversation.
            </p>
            <textarea
              className="settings-textarea"
              placeholder="e.g. You are a concise assistant. Always reply in bullet points."
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={4}
            />
            <div className="settings-row-btns" style={{ marginTop: 8 }}>
              <button className="settings-btn primary" onClick={savePrompt}>
                {promptSaved ? '✓ Saved' : 'Save prompt'}
              </button>
              {promptDraft && (
                <button className="settings-btn ghost" onClick={() => { setPromptDraft(''); onSystemPromptChange('') }}>
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* ── Data ─────────────────────────────────────── */}
          <section className="settings-section">
            <div className="settings-section-title">Conversation</div>
            <button className="settings-btn danger" onClick={confirmClear}>
              Clear all messages
            </button>
            <p className="settings-help" style={{ marginTop: 6 }}>Removes all messages from this session only.</p>
          </section>

        </div>
      </div>
    </>
  )
}
