import { sfFetch } from './_sf.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const { sessionId } = req.body ?? {}
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' })

  try {
    await sfFetch(`/sessions/${sessionId}`, { method: 'DELETE' })
    res.status(204).end()
  } catch (err) {
    console.error('end-session error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
