import { useState } from 'react'

interface Props {
  onSave: (key: string) => void
}

export default function ApiKeyInput({ onSave }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key must start with "sk-ant-". Get a key from console.anthropic.com.')
      return
    }
    setError('')
    onSave(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="apikey-screen">
      <div className="apikey-card">
        <span className="apikey-icon">🤖</span>
        <h1>Claude Chat</h1>
        <p>
          Enter your Anthropic API key to start chatting. Your key is stored
          only in your browser&apos;s localStorage and sent directly to
          api.anthropic.com — never to any intermediate server.
        </p>

        <label className="apikey-label">API Key</label>
        <div className="apikey-input-row">
          <input
            type={show ? 'text' : 'password'}
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="apikey-toggle"
            onClick={() => setShow((v) => !v)}
            type="button"
            title={show ? 'Hide key' : 'Show key'}
          >
            {show ? '🙈' : '👁'}
          </button>
        </div>

        {error && <div className="apikey-error">{error}</div>}

        <button className="apikey-save-btn" onClick={handleSave}>
          Save &amp; Continue
        </button>

        <p className="apikey-footer">
          Don&apos;t have a key?{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
            Get one at console.anthropic.com
          </a>
          <br />
          ⚠️ Do not use this app on a shared or untrusted computer.
        </p>
      </div>
    </div>
  )
}
