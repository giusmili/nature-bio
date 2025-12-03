// api/claude.ts
export const config = {
    runtime: 'nodejs18.x',
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        console.error('Missing ANTHROPIC_API_KEY on Vercel')
        res.status(500).json({ error: 'Server missing ANTHROPIC_API_KEY' })
        return
    }

    try {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(req.body), // Vercel parses JSON automatically
        })

        const text = await upstream.text()
        res.status(upstream.status).send(text)
    } catch (error: any) {
        console.error('Anthropic upstream error:', error)
        res.status(500).json({ error: error.message || 'Unknown error' })
    }
}
