import { Evidence } from '../types/factCheck';

export interface CitationValidationResult {
    valid: ValidCitation[];
    invalid: InvalidCitation[];
    summary: {
        total: number;
        accessible: number;
        inaccessible: number;
        averageCredibility: number;
    };
}

export interface ValidCitation {
    url: string;
    status: 'accessible';
    credibility: number;
}

export interface InvalidCitation {
    url: string;
    status: 'paywall' | 'broken' | 'error' | 'invalid_format';
    credibility: number;
    reason: string;
}

export class CitationValidatorService {
    private static instance: CitationValidatorService;

    private constructor() {}

    public static getInstance(): CitationValidatorService {
        if (!CitationValidatorService.instance) {
            CitationValidatorService.instance = new CitationValidatorService();
        }
        return CitationValidatorService.instance;
    }

    async validateCitations(evidence: Evidence[]): Promise<CitationValidationResult> {
        const response = await fetch('/api/validate-citations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                citations: evidence.map(e => ({ url: e.url, publisher: e.publisher, quote: e.quote }))
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Citation validation failed');
        }

        return await response.json();
    }
}