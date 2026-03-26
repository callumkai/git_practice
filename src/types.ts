export type ModelId =
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'

export interface ModelOption {
  id: ModelId
  label: string
  description: string
}

export const MODELS: ModelOption[] = [
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Most capable' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: 'Balanced' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Fastest' },
]

export type MessageRole = 'user' | 'assistant'

export interface Attachment {
  id: string
  name: string
  kind: 'image' | 'pdf' | 'text'
  mimeType: string
  dataUrl: string   // full data URL for display (data:image/jpeg;base64,...)
  base64: string    // raw base64 without the data URL prefix, for API
  size: number      // file size in bytes
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
  isSearching?: boolean  // true while web search is in progress
}
