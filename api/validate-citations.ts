import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Citation {
    url: string;
    publisher: string;
    quote: string;
}

// A mock function to simulate checking URL accessibility and credibility
// In a real application, this would involve more complex logic,
// maybe even a headless browser to check for paywalls.
const checkUrlStatus = async (url: string) => {
    try {
        // Basic check for common invalid URL patterns
        if (!url || !url.startsWith('http')) {
            return { status: 'invalid_format', credibility: 0 };
        }

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

        // Mock different outcomes based on URL
        if (url.includes("paywall-example.com")) return { status: 'paywall', credibility: 40 };
        if (url.includes("404-example.com")) return { status: 'broken', credibility: 0 };
        if (url.includes("unreliable-source.com")) return { status: 'accessible', credibility: 25 };

        // Default to accessible with good credibility
        return { status: 'accessible', credibility: 80 + Math.floor(Math.random() * 15) };

    } catch (error) {
        return { status: 'error', credibility: 0 };
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { citations } = req.body as { citations: Citation[] };

    if (!citations || !Array.isArray(citations)) {
        return res.status(400).json({ error: 'Invalid input: "citations" must be an array.' });
    }

    const validationResults = await Promise.all(
        citations.map(async (citation) => {
            const { status, credibility } = await checkUrlStatus(citation.url);
            return {
                ...citation,
                status,
                credibility,
                reason: status !== 'accessible' ? `${status.replace('_', ' ')}` : undefined,
            };
        })
    );

    const valid = validationResults.filter(r => r.status === 'accessible');
    const invalid = validationResults.filter(r => r.status !== 'accessible');

    const summary = {
        total: citations.length,
        accessible: valid.length,
        inaccessible: invalid.length,
        averageCredibility: valid.length > 0
            ? Math.round(valid.reduce((acc, c) => acc + c.credibility, 0) / valid.length)
            : 0,
    };

    res.status(200).json({
        valid,
        invalid,
        summary,
    });
}