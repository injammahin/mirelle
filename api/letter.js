// Short letter links: stores the encoded letter under a cute id (e.g. "ayesha-k7q2").
// Storage: Upstash Redis (Vercel Marketplace → "Upstash for Redis", free tier).
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const YEAR = 60 * 60 * 24 * 365

async function redis(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) })
  if (!r.ok) throw new Error('kv ' + r.status)
  return (await r.json()).result
}

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16)

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN) return res.status(503).json({ error: 'storage not configured' })
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      const { payload, to } = body
      if (typeof payload !== 'string' || payload.length < 10 || payload.length > 150000) return res.status(400).json({ error: 'bad letter' })
      const base = slugify(to) || 'letter'
      for (let i = 0; i < 6; i++) {
        const code = Math.random().toString(36).slice(2, 6)
        const id = `${base}-${code}`
        const ok = await redis(['SET', 'letter:' + id, JSON.stringify({ payload, to: String(to || '').slice(0, 30) }), 'NX', 'EX', YEAR])
        if (ok === 'OK') return res.status(200).json({ id })
      }
      return res.status(500).json({ error: 'try again' })
    }
    const id = String(req.query.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
    const v = id && (await redis(['GET', 'letter:' + id]))
    if (!v) return res.status(404).json({ error: 'not found' })
    res.setHeader('Cache-Control', 'public, s-maxage=31536000, immutable')
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send(v)
  } catch (e) {
    return res.status(500).json({ error: 'server' })
  }
}
