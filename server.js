/**
 * Claude Chat — Express backend
 *
 * Proxies requests to the Anthropic API so the browser never calls it directly.
 * Handles both streaming (SSE) and non-streaming (web-search) responses.
 *
 * Dev:  npm run dev   → starts this server + Vite in parallel
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

// ── Proxy /api/messages → Anthropic ──────────────────────────────────────────

app.post('/api/messages', async (req, res) => {
  const apiKey = /** @type {string} */ (req.headers['x-api-key'])

  if (!apiKey) {
    return res.status(400).json({ error: { message: 'Missing x-api-key header' } })
  }

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

    // Forward the status code
    res.status(upstream.status)

    // Forward safe headers from Anthropic
    for (const key of ['content-type', 'x-request-id']) {
      const val = upstream.headers.get(key)
      if (val) res.setHeader(key, val)
    }

    if (!upstream.body) {
      return res.end()
    }

    // Pipe the raw response body back — works for both SSE and JSON
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
      res.status(502).json({
        error: { message: err instanceof Error ? err.message : 'Proxy error' },
      })
    }
  }
})

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ── Serve the built frontend in production ────────────────────────────────────

const distDir = join(__dirname, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')))
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ✦ Claude Chat backend  →  http://localhost:${PORT}`)
  console.log(`    Proxying /api/messages → ${ANTHROPIC_URL}\n`)
})
