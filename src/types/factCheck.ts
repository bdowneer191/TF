export interface FactCheckReport {
    final_verdict: string;
    final_score: number;
    evidence: Evidence[];
    score_breakdown: ScoreBreakdown;
    metadata: Metadata;
    searchEvidence?: any; // Define more strictly if used
    [key: string]: any; // Allow for extensibility
}

export type EvidenceType = 'news' | 'expert' | 'research' | 'opinion' | 'government' | 'other';

export interface Evidence {
    id: string;
    type: EvidenceType;
    publisher: string;
    url: string;
    quote: string;
    score: number; // Credibility score for this piece of evidence
}

export interface ScoreBreakdown {
    final_score_formula: string;
    metrics: Metric[];
    confidence_intervals: {
        lower_bound: number;
        upper_bound: number;
    };
}

export interface Metric {
    name: string;
    value: number; // Can be a score, percentage, etc.
    explanation?: string;
}

export interface Metadata {
    method_used: string;
    processing_time_ms: number;
    apis_used: string[];
    sources_consulted: {
        total: number;
        high_credibility: number;
        conflicting: number;
    };
    warnings: string[];
    citationValidation?: any; // To be populated by CitationValidatorService result
}