import { FactCheckReport } from '../types/factCheck';

/**
 * Mock tracking service. In a real application, this would send data
 * to a service like Google Analytics, Mixpanel, or a custom logging endpoint.
 */

export const trackFactCheckUsage = (report: FactCheckReport) => {
    // This is where you would integrate with a real analytics service.
    // For now, we'll just log it to the console.

    const usageData = {
        event: 'fact_check_completed',
        timestamp: new Date().toISOString(),
        method: report.metadata.method_used,
        processingTime: report.metadata.processing_time_ms,
        finalScore: report.final_score,
        sourcesConsulted: report.metadata.sources_consulted.total,
        warningsCount: report.metadata.warnings.length,
        apis: report.metadata.apis_used.join(','),
    };

    console.log("📊 Analytics Event:", usageData);

    // Example of how you might send this to a backend endpoint:
    /*
    fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usageData)
    }).catch(error => console.error("Failed to send tracking data:", error));
    */
};

export const trackExport = (format: string) => {
    console.log("📊 Analytics Event:", {
        event: 'export_completed',
        timestamp: new Date().toISOString(),
        format: format,
    });
};

export const trackError = (error: Error, context: string) => {
     console.error("📊 Error Event:", {
        event: 'error_occurred',
        timestamp: new Date().toISOString(),
        context: context, // e.g., 'analysis', 'export', 'schema_generation'
        errorMessage: error.message,
        stack: error.stack?.substring(0, 200), // Keep it concise
    });
};