import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100dvh', gap: 16, padding: 24,
          background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</div>
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 400,
            background: 'rgba(255,255,255,0.05)', padding: '10px 14px',
            borderRadius: 10, fontFamily: 'monospace', wordBreak: 'break-all',
          }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', background: '#0a84ff', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
