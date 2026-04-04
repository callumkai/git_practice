import type { Conversation } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  activeId: string | null
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Sidebar({ open, onClose, conversations, activeId, onNewChat, onSelect, onDelete }: Props) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <div className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand">✦ Claude Chat</span>
          <button className="sidebar-close" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        <button className="sidebar-new-btn" onClick={() => { onNewChat(); onClose() }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          New Chat
        </button>

        <div className="sidebar-list">
          {conversations.length === 0 ? (
            <p className="sidebar-empty">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`sidebar-item${conv.id === activeId ? ' active' : ''}`}
                onClick={() => { onSelect(conv.id); onClose() }}
              >
                <div className="sidebar-item-title">{conv.title}</div>
                <div className="sidebar-item-time">{relativeTime(conv.updatedAt)}</div>
                <button
                  className="sidebar-item-delete"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
