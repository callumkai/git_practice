export type ModelId =
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'

export interface ModelOption {
  id: ModelId
  label: string
  description: string
}

export const MODELS: ModelOption[] = [
  { id: 'claude-opus-4-6',          label: 'Claude Opus 4.6',   description: 'Most capable' },
  { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6', description: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5',  description: 'Fastest' },
]

export type MessageRole = 'user' | 'assistant'

export interface Attachment {
  id: string
  name: string
  kind: 'image' | 'pdf' | 'text'
  mimeType: string
  dataUrl: string
  base64: string
  size: number
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  isStreaming: boolean
  model?: ModelId
  error?: string
  timestamp: number
  attachments?: Attachment[]
  isSearching?: boolean
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages?: Message[]
}
