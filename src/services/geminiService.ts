import { FactCheckReport } from '../types/factCheck';

// This is a mock service. In a real implementation, this would interact with the Google Gemini API.
const MOCK_API_LATENCY = 1500;

export const runFactCheckOrchestrator = async (
    content: string,
    method: 'fast' | 'comprehensive' | 'newsdata'
): Promise<FactCheckReport> => {
    console.log(`Running fact check orchestrator with method: ${method}`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_LATENCY));

    // Simulate different responses based on method
    if (method === 'fast') {
        return {
            final_verdict: "Initial analysis suggests some claims may be exaggerated.",
            final_score: 62,
            evidence: [
                { id: 'ev1', type: 'news', publisher: 'Quick News', url: 'https://example.com/news', quote: 'A related event occurred last week.', score: 70 },
            ],
            score_breakdown: {
                final_score_formula: "Simplified scoring model.",
                metrics: [{ name: 'Source Credibility', value: 65 }],
                confidence_intervals: { lower_bound: 55, upper_bound: 70 }
            },
            metadata: {
                method_used: "fast",
                processing_time_ms: MOCK_API_LATENCY - 200,
                apis_used: ["gemini-pro-vision"],
                sources_consulted: { total: 5, high_credibility: 1, conflicting: 1 },
                warnings: ["Fast mode provides a preliminary check only."],
            },
        };
    }

    // Comprehensive mock
    return {
        final_verdict: "The claims in the article are largely unsubstantiated and rely on biased sources.",
        final_score: 38,
        evidence: [
            { id: 'ev1', type: 'expert', publisher: 'Reputable News Source', url: 'https://example.com/source1', quote: 'The study found a correlation, not causation.', score: 85 },
            { id: 'ev2', type: 'opinion', publisher: 'Blog with Known Bias', url: 'https://example.com/source2', quote: 'This is a clear sign of a conspiracy.', score: 22 },
            { id: 'ev3', type: 'research', publisher: 'Academic Journal', url: 'https://example.com/source3', quote: 'Further research is needed to draw firm conclusions.', score: 75 },
        ],
        score_breakdown: {
            final_score_formula: "Weighted average of evidence credibility and claim alignment.",
            metrics: [
                { name: 'Source Credibility', value: 45 },
                { name: 'Evidence Strength', value: 35 },
                { name: 'Claim Alignment', value: 30 }
            ],
            confidence_intervals: { lower_bound: 30, upper_bound: 45 }
        },
        metadata: {
            method_used: "comprehensive",
            processing_time_ms: MOCK_API_LATENCY,
            apis_used: ["gemini-pro", "serper-api", "web-extractor"],
            sources_consulted: { total: 15, high_credibility: 3, conflicting: 5 },
            warnings: ['Multiple sources show significant political bias.', 'One key source could not be accessed.'],
        },
    };
};


export const fetchNewsData = async (query: string) => {
    console.log(`Fetching news data for: ${query}`);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock news articles
    return [
        {
            source: 'Major News Outlet',
            link: 'https://example.com/news1',
            title: `Article discussing "${query}"`,
        },
        {
            source: 'Another News Source',
            link: 'https://example.com/news2',
            title: `Recent developments related to "${query}"`,
        }
    ];
};