// /l/<id> → the app, with a personalised link preview ("A letter for Ayesha 💌").
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export default async function handler(req, res) {
  const id = String(req.query.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `${proto}://${host}`
  let to = ''
  try {
    const r = await fetch(`${origin}/api/letter?id=${id}`)
    if (r.ok) to = JSON.parse(await r.text()).to || ''
  } catch {
    /* preview falls back to the generic card */
  }
  let html = await (await fetch(origin + '/index.html')).text()
  const title = to ? `A letter for ${esc(to)} 💌` : 'A letter for you 💌'
  const desc = 'Sealed with wax and sent with love. Tap to open ✦'
  const img = `${origin}/og/letter.jpg`
  const og = `<!--og-->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Mirelle" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${origin}/l/${id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="description" content="${desc}" />
    <!--/og-->`
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`).replace(/<!--og-->[\s\S]*?<!--\/og-->/, og)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(html)
}
