// Shared Salesforce helpers — solo se ejecuta en el servidor (Vercel Functions)
// Las credenciales NUNCA llegan al browser

const SF_DOMAIN       = process.env.SF_DOMAIN
const AGENT_API       = process.env.AGENT_API
const AGENT_ID        = process.env.AGENT_ID
const CONSUMER_KEY    = process.env.SF_CONSUMER_KEY
const CONSUMER_SECRET = process.env.SF_CONSUMER_SECRET

// Token cache en memoria (válido entre invocaciones en la misma instancia caliente)
let _cachedToken  = null
let _tokenExpires = 0

export async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpires) return _cachedToken

  const res = await fetch(`${SF_DOMAIN}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CONSUMER_KEY,
      client_secret: CONSUMER_SECRET,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Auth failed ${res.status}: ${err}`)
  }

  const data = await res.json()
  _cachedToken  = data.access_token
  // Renueva 60s antes de que expire
  _tokenExpires = Date.now() + ((data.expires_in ?? 7200) - 60) * 1000

  return _cachedToken
}

export async function sfFetch(path, options = {}) {
  const token = await getToken()
  const url   = path.startsWith('http') ? path : `${AGENT_API}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Salesforce ${res.status}: ${err}`)
  }

  return res.status === 204 ? null : res.json()
}

export { AGENT_ID, SF_DOMAIN }
