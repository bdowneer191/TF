import { FactCheckReport } from '../types/factCheck';

export type ExportFormat = 'json-full' | 'json-summary' | 'csv-evidence';

const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
};

export const handleExport = (result: FactCheckReport, format: ExportFormat) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');

    switch (format) {
        case 'json-full':
            downloadFile(
                `fact-check-report-${timestamp}.json`,
                JSON.stringify(result, null, 2),
                'application/json'
            );
            break;

        case 'json-summary':
            const summary = {
                final_verdict: result.final_verdict,
                final_score: result.final_score,
                warnings: result.metadata.warnings,
                sources_consulted: result.metadata.sources_consulted.total,
            };
            downloadFile(
                `summary-report-${timestamp}.json`,
                JSON.stringify(summary, null, 2),
                'application/json'
            );
            break;

        case 'csv-evidence':
            const headers = ['id', 'type', 'publisher', 'url', 'quote', 'score'];
            const csvContent = [
                headers.join(','),
                ...result.evidence.map(e => headers.map(h => `"${e[h as keyof typeof e]}"`).join(','))
            ].join('\n');
            downloadFile(
                `evidence-list-${timestamp}.csv`,
                csvContent,
                'text/csv'
            );
            break;
    }
};