/**
 * Claude Chat — Express backend
 *
 * - Proxies /api/messages to Anthropic (handles streaming + JSON)
 * - Stores conversations in memory (CRUD at /api/conversations)
 * - Serves the built frontend from /dist in production
 *
 * Dev:  npm run dev   (starts this + Vite in parallel via concurrently)
 * Prod: npm run build && npm start
 */

import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const app = express()
app.use(express.json({ limit: '50mb' }))

// ── In-memory conversation store ──────────────────────────────────────────────

/** @type {Map<string, {id:string,title:string,messages:any[],createdAt:number,updatedAt:number}>} */
const conversations = new Map()

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// List conversations (newest first)
app.get('/api/conversations', (_req, res) => {
  const list = [...conversations.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
  res.json(list)
})

// Create new conversation
app.post('/api/conversations', (_req, res) => {
  const id = newId()
  const conv = { id, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }
  conversations.set(id, conv)
  res.status(201).json(conv)
})

// Get single conversation (with messages)
app.get('/api/conversations/:id', (req, res) => {
  const conv = conversations.get(req.params.id)
  if (!conv) return res.status(404).json({ error: 'Not found' })
  res.json(conv)
})

// Save/update conversation (replace messages, update title)
app.put('/api/conversations/:id', (req, res) => {
  const conv = conversations.get(req.params.id)
  if (!conv) return res.status(404).json({ error: 'Not found' })
  conv.messages = req.body.messages ?? conv.messages
  conv.title = req.body.title ?? conv.title
  conv.updatedAt = Date.now()
  res.json({ id: conv.id, title: conv.title, updatedAt: conv.updatedAt })
})

// Delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  if (!conversations.has(req.params.id)) return res.status(404).json({ error: 'Not found' })
  conversations.delete(req.params.id)
  res.status(204).end()
})

// ── Proxy /api/messages → Anthropic ──────────────────────────────────────────

app.post('/api/messages', async (req, res) => {
  const apiKey = /** @type {string} */ (req.headers['x-api-key'])
  if (!apiKey) return res.status(400).json({ error: { message: 'Missing x-api-key header' } })

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    res.status(upstream.status)
    for (const key of ['content-type', 'x-request-id']) {
      const val = upstream.headers.get(key)
      if (val) res.setHeader(key, val)
    }

    if (!upstream.body) return res.end()

    const reader = upstream.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
    res.end()
  } catch (err) {
    console.error('[proxy error]', err)
    if (!res.headersSent) {
      res.status(502).json({ error: { message: err instanceof Error ? err.message : 'Proxy error' } })
    }
  }
})

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true, conversations: conversations.size }))

// ── Serve built frontend in production ────────────────────────────────────────

const distDir = join(__dirname, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')))
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ✦ Claude Chat backend  →  http://localhost:${PORT}`)
  console.log(`    /api/messages  proxied to Anthropic`)
  console.log(`    /api/conversations  in-memory store\n`)
})
