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
      setError('Key must start with "sk-ant-". Get yours at console.anthropic.com.')
      return
    }
    setError('')
    onSave(trimmed)
  }

  return (
    <div className="apikey-screen">
      <div className="apikey-card">
        <div className="apikey-brand">
          <div className="apikey-brand-icon">✦</div>
          <span className="apikey-brand-name">Claude Chat</span>
        </div>

        <h2>Connect your API key</h2>
        <p>
          Your key is stored locally in your browser and sent directly to
          Anthropic — never to any other server.
        </p>

        <label className="apikey-label">Anthropic API Key</label>
        <div className="apikey-input-row">
          <input
            type={show ? 'text' : 'password'}
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            autoComplete="off"
          />
          <button
            className="apikey-toggle"
            onClick={() => setShow((v) => !v)}
            type="button"
            title={show ? 'Hide' : 'Show'}
          >
            {show ? '🙈' : '👁'}
          </button>
        </div>

        {error && <div className="apikey-error">{error}</div>}

        <button className="apikey-save-btn" onClick={handleSave}>
          Continue
        </button>

        <p className="apikey-footer">
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
            Get an API key →
          </a>
          <br />
          Do not use on a shared device.
        </p>
      </div>
    </div>
  )
}
