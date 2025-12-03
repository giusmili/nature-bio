// api/claude.ts

export default {
    // Vercel Node.js runtime: fetch-style handler
    async fetch(request: Request): Promise<Response> {
        try {
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers: { 'content-type': 'application/json' },
                })
            }

            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) {
                console.error('Missing ANTHROPIC_API_KEY in environment')
                return new Response(
                    JSON.stringify({
                        error: 'Server misconfiguration: ANTHROPIC_API_KEY missing',
                    }),
                    {
                        status: 500,
                        headers: { 'content-type': 'application/json' },
                    }
                )
            }

            // Body we got from the browser (same shape as local dev)
            const body = await request.json()

            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify(body),
            })

            const text = await upstream.text()

            // Forward Anthropic response as-is to the browser
            return new Response(text, {
                status: upstream.status,
                headers: {
                    'content-type': upstream.headers.get('content-type') ?? 'application/json',
                },
            })
        } catch (err: any) {
            console.error('Error in /api/claude function:', err)

            return new Response(
                JSON.stringify({
                    error: 'Upstream call to Anthropic failed',
                    details: err?.message || String(err),
                }),
                {
                    status: 500,
                    headers: { 'content-type': 'application/json' },
                }
            )
        }
    },
}
