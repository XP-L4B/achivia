import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin dev: in locale (`npm run dev`) intercetta /api/opensea e riusa lo stesso
// handler della funzione serverless, così non serve deployare nulla per provare.
function openseaDevProxy(apiKey) {
  return {
    name: 'opensea-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/opensea', async (req, res) => {
        const url = new URL(req.originalUrl || req.url, 'http://localhost')
        const { proxyOpenSea } = await import('./api/_core.js')
        const { status, body } = await proxyOpenSea(url.searchParams.get('path'), apiKey)
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      })
    },
  }
}

// Plugin dev: intercetta POST /api/ollama e riusa lo stesso handler della
// funzione serverless, così la key resta lato server anche in locale.
function ollamaDevProxy(apiKey) {
  return {
    name: 'ollama-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ollama', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Solo POST' }))
          return
        }
        let raw = ''
        for await (const chunk of req) raw += chunk
        let payload
        try { payload = JSON.parse(raw || '{}') } catch { payload = null }
        const { proxyOllamaChat } = await import('./api/_core.js')
        const { status, body } = await proxyOllamaChat(payload, apiKey)
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carica anche le variabili senza prefisso VITE_ (la key resta lato server).
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      openseaDevProxy(env.OPENSEA_API_KEY),
      ollamaDevProxy(env.OLLAMA_API_KEY),
    ],
    base: '/achivia/',
  }
})
