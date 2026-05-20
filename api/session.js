import { sfFetch, AGENT_ID, SF_DOMAIN } from './_sf.js'
import { randomUUID } from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { customerId } = req.body ?? {}

  try {
    const data = await sfFetch(`/agents/${AGENT_ID}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        externalSessionKey: randomUUID(),
        instanceConfig: { endpoint: SF_DOMAIN },
        variables: customerId
          ? [{ name: 'customerId', type: 'Text', value: customerId }]
          : [],
      }),
    })

    res.json({ sessionId: data.sessionId ?? data.id })
  } catch (err) {
    console.error('session error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
