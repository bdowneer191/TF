interface EvidenceItem {
    publisher: string;
    url: string;
    quote: string;
    publicationDate?: string; // Optional: YYYY-MM-DD
    author?: string;
}

export class CitationFormatter {

    /**
     * Generates a bibliography for a list of evidence items in a specified style.
     * @param evidence - Array of evidence items.
     * @param style - The citation style ('apa', 'mla', 'chicago').
     * @returns A formatted string representing the bibliography.
     */
    static generateBibliography(evidence: EvidenceItem[], style: 'apa' | 'mla' | 'chicago'): string {
        return evidence
            .map((item, index) => this.format(item, index + 1, style))
            .join('\n');
    }

    /**
     * Formats a single evidence item according to the specified style.
     * @param item - The evidence item to format.
     * @param index - The index for numbered styles.
     * @param style - The citation style.
     * @returns A formatted citation string.
     */
    static format(item: EvidenceItem, index: number, style: 'apa' | 'mla' | 'chicago'): string {
        switch (style) {
            case 'apa':
                return this.formatAPA(item);
            case 'mla':
                return this.formatMLA(item);
            case 'chicago':
                return this.formatChicago(item, index);
            default:
                return `${index}. ${item.publisher}. "${item.quote}" Retrieved from ${item.url}`;
        }
    }

    /**
     * Formats a citation in APA 7th edition style.
     * Example: American Psychological Association. (2020). Publisher. https://example.com
     */
    static formatAPA(item: EvidenceItem): string {
        const author = item.author || item.publisher;
        const date = item.publicationDate ? new Date(item.publicationDate).getFullYear() : 'n.d.';
        return `${author}. (${date}). *${item.quote}*. Retrieved from ${item.url}`;
    }

    /**
     * Formats a citation in MLA 9th edition style.
     * Example: "Quote from article." Publisher, Day Month Year, URL.
     */
    static formatMLA(item: EvidenceItem): string {
        const publisher = item.publisher;
        const date = item.publicationDate ? new Date(item.publicationDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'n.d.';
        return `"${item.quote}." *${publisher}*, ${date}, ${item.url}.`;
    }

    /**
     * Formats a citation in Chicago style (17th ed., note-bibliography).
     * Example: 1. Publisher, "Quote," accessed Month Day, Year, URL.
     */
    static formatChicago(item: EvidenceItem, index: number): string {
        const accessedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return `${index}. ${item.publisher}, "${item.quote}," accessed ${accessedDate}, ${item.url}.`;
    }

    /**
     * Generates an inline citation.
     * @param item - The evidence item.
     * @param style - The citation style.
     * @param index - Optional index for numbered styles.
     * @returns A string for inline citation (e.g., "[1]" or "(Smith, 2020)").
     */
    static inlineCitation(item: EvidenceItem, style: 'apa' | 'mla' | 'chicago', index?: number): string {
        if (style === 'chicago' && index) {
            return `[${index}]`;
        }
        if (style === 'apa') {
            const year = item.publicationDate ? new Date(item.publicationDate).getFullYear() : 'n.d.';
            return `(${(item.author || item.publisher).split(' ')[0]}, ${year})`;
        }
        if (style === 'mla') {
            return `(${(item.author || item.publisher).split(' ')[0]})`;
        }
        return `[${index || 1}]`;
    }
}