import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: false, // disable auto-parse so we can forward raw body (needed for multipart)
  },
}

/**
 * Vercel Serverless proxy: forwards /api-proxy/* requests to the target API,
 * injecting the API key from environment variables.
 *
 * Env vars:
 *   API_KEY       — required, the API key
 *   API_BASE_URL  — optional, defaults to https://yunwu.ai/v1
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY not configured on server' })
  }

  const baseUrl = (process.env.API_BASE_URL || 'https://yunwu.ai/v1').replace(/\/+$/, '')

  // Extract the path after /api-proxy
  // vercel.json rewrites /api-proxy/:path* → /api/proxy?path=:path*
  const subPath = req.query.path
  const pathSegments = Array.isArray(subPath) ? subPath.join('/') : (subPath || '')
  const targetUrl = `${baseUrl}/${pathSegments}`

  try {
    // Read raw body
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const rawBody = Buffer.concat(chunks)

    const contentType = req.headers['content-type'] || 'application/json'

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': contentType,
    }

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: rawBody,
    })

    const responseText = await upstream.text()
    res.status(upstream.status)

    const upstreamContentType = upstream.headers.get('content-type')
    if (upstreamContentType) {
      res.setHeader('Content-Type', upstreamContentType)
    }

    return res.send(responseText)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: `Proxy error: ${message}` })
  }
}
