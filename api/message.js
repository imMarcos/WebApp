import { sfFetch } from './_sf.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { sessionId, message, sequenceId = 1 } = req.body ?? {}

  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId y message son requeridos' })

  try {
    const data = await sfFetch(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message: { sequenceId, type: 'Text', text: message },
      }),
    })

    // La API puede devolver el texto en distintos campos según la versión
    const reply =
      data?.messages?.find((m) => m.type === 'Inform')?.message ??
      data?.messages?.[0]?.message ??
      data?.messages?.[0]?.text ??
      data?.reply ??
      'Sin respuesta del agente.'

    res.json({ reply })
  } catch (err) {
    console.error('message error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
