// api/claude.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        console.error('Missing ANTHROPIC_API_KEY in environment')
        return res.status(500).json({ error: 'Server misconfiguration: ANTHROPIC_API_KEY missing' })
    }

    try {
        // On Vercel, req.body is already parsed JSON if content-type is application/json
        const body = req.body

        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                // ⚠️ CORS header NOT needed here: this is server-to-server, no browser
            },
            body: JSON.stringify(body),
        })

        const text = await upstream.text()

        // Forward Anthropic's status + body as-is to the frontend
        res.status(upstream.status).send(text)
    } catch (err: any) {
        console.error('Error calling Anthropic from Vercel function:', err)
        return res.status(500).json({
            error: 'Upstream call to Anthropic failed',
            details: err?.message || String(err),
        })
    }
}
