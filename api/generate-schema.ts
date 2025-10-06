import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper function to map our score to Schema.org's reviewRating scale (1-5)
const normalizeRating = (score: number): number => {
    if (score > 80) return 5; // Excellent
    if (score > 60) return 4; // Good
    if (score > 40) return 3; // Average
    if (score > 20) return 2; // Poor
    return 1; // Very Poor
};

// Helper to generate a text-based alternate name based on the verdict
const getAlternateName = (verdict: string): string => {
    if (verdict.toLowerCase().includes('true')) return "True";
    if (verdict.toLowerCase().includes('false')) return "False";
    if (verdict.toLowerCase().includes('misleading')) return "Misleading";
    if (verdict.toLowerCase().includes('unsubstantiated')) return "Unsubstantiated";
    return "Fact-Check";
}

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { claim, score, verdict, evidence, publisherInfo } = req.body;

    if (!claim || score === undefined || !verdict || !publisherInfo) {
        return res.status(400).json({ error: 'Missing required fields for schema generation.' });
    }

    const claimReviewSchema = {
        "@context": "https://schema.org",
        "@type": "ClaimReview",
        "datePublished": new Date().toISOString(),
        "url": publisherInfo.articleUrl,
        "claimReviewed": claim,
        "author": {
            "@type": "Organization",
            "name": publisherInfo.organizationName,
            "url": publisherInfo.organizationUrl,
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": normalizeRating(score),
            "bestRating": 5,
            "worstRating": 1,
            "alternateName": getAlternateName(verdict),
            "ratingExplanation": verdict,
        },
        "itemReviewed": {
            "@type": "CreativeWork",
            "author": {
                "@type": "Person",
                "name": publisherInfo.authorName || "Unknown Author",
            },
            "datePublished": new Date().toISOString().split('T')[0], // Assuming article is published now
            "headline": publisherInfo.headline,
        }
    };

    const newsArticleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": publisherInfo.headline,
        "url": publisherInfo.articleUrl,
        "datePublished": new Date().toISOString(),
        "author": [{
            "@type": "Person",
            "name": publisherInfo.authorName || "Editorial Staff",
            "url": publisherInfo.organizationUrl,
        }],
        "publisher": {
            "@type": "Organization",
            "name": publisherInfo.organizationName,
            "logo": {
                "@type": "ImageObject",
                "url": `${publisherInfo.organizationUrl}/logo.png` // Assumed logo URL
            }
        },
        // Link the fact check to the article
        "mainEntityOfPage": {
             "@type": "WebPage",
             "@id": publisherInfo.articleUrl
        },
        "keywords": ["fact-check", getAlternateName(verdict).toLowerCase()],
        // Add the ClaimReview as a subject of the article
        "about": claimReviewSchema
    };

    // Combine schemas into a single JSON-LD script
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            claimReviewSchema,
            newsArticleSchema
        ]
    };

    const htmlSnippet = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;

    res.status(200).json({
        message: "Schema.org markup generated successfully.",
        claimReviewSchema,
        newsArticleSchema,
        htmlSnippet
    });
}