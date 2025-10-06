import React, { useState, useEffect, useRef } from 'react';
import { FileText, Newspaper, Edit, CheckCircle, XCircle, AlertTriangle, Clipboard, Download, Settings, ChevronDown, Search, Link as LinkIcon, BookOpen, Quote, Calendar, Building, Zap, Bot, Eye, Code, ThumbsUp, ThumbsDown } from 'lucide-react';
import { runFactCheckOrchestrator } from '../services/geminiService';
import { CitationValidatorService } from '../services/citationValidator';
import { AutoEditorIntegrationService, EditorMode } from '../services/autoEditorIntegration';
import { handleExport, ExportFormat } from '../utils/export';

// Main Component
const TruScopeJournalismPlatform = () => {
    const [activeTab, setActiveTab] = useState('analyze');
    const [content, setContent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [factCheckResult, setFactCheckResult] = useState<any>(null);
    const [editorResult, setEditorResult] = useState<any>(null);
    const [publishingContext, setPublishingContext] = useState('journalism');
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await runFactCheckOrchestrator(content, 'comprehensive');
            const citationService = CitationValidatorService.getInstance();
            const validation = await citationService.validateCitations(result.evidence);
            setFactCheckResult({
                ...result,
                metadata: {
                    ...result.metadata,
                    citationValidation: validation
                }
            });
            setActiveTab('report');
        } catch (error: any) {
            setError(`Analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAutoCorrect = async (mode: EditorMode) => {
        if (!factCheckResult) return;
        try {
            const editorService = AutoEditorIntegrationService.getInstance();
            const result = await editorService.performAutoCorrection(content, factCheckResult, mode);
            setEditorResult(result);
            setActiveTab('edit');
        } catch (error: any) {
            setError(`Auto-correction failed: ${error.message}`);
        }
    };

    const handleGenerateSchema = async () => {
        if (!factCheckResult) return;
        try {
            const response = await fetch('/api/generate-schema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    claim: content.substring(0, 100) + "...",
                    score: factCheckResult.final_score,
                    verdict: factCheckResult.final_verdict,
                    evidence: factCheckResult.evidence,
                    publisherInfo: {
                        organizationName: 'Your Publication',
                        organizationUrl: 'https://yourpublication.com',
                        articleUrl: 'https://yourpublication.com/article-slug',
                        headline: 'Article Headline',
                        authorName: 'Author Name'
                    }
                }),
            });
            if (!response.ok) throw new Error('Failed to generate schema');
            const data = await response.json();
            // For now, just log it. A real implementation would show a modal.
            console.log(data.htmlSnippet);
            alert("Schema.org markup copied to clipboard (check console)!");
            navigator.clipboard.writeText(data.htmlSnippet);
        } catch (error: any) {
            setError(`Schema generation failed: ${error.message}`);
        }
    };

    const renderHeader = () => (
        <div className="p-6 border-b border-gray-700">
            <h1 className="text-3xl font-bold text-white">TruScope Professional</h1>
            <p className="text-gray-400">Your AI-powered partner for journalistic integrity.</p>
        </div>
    );

    const renderTabs = () => (
        <div className="flex p-2 bg-gray-800 rounded-t-lg">
            {['analyze', 'report', 'edit'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={(!factCheckResult && tab !== 'analyze') || (!editorResult && tab === 'edit')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'analyze':
                return <AnalysisPanel content={content} setContent={setContent} handleAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} publishingContext={publishingContext} setPublishingContext={setPublishingContext} />;
            case 'report':
                return <ReportPanel result={factCheckResult} handleAutoCorrect={handleAutoCorrect} handleGenerateSchema={handleGenerateSchema} />;
            case 'edit':
                return <EditPanel result={editorResult} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="container mx-auto p-4">
                {renderHeader()}
                <div className="bg-gray-800 rounded-lg shadow-2xl mt-4">
                    {renderTabs()}
                    <div className="p-6">
                        {error && <div className="p-4 mb-4 text-sm text-red-300 bg-red-900 rounded-lg" role="alert">{error}</div>}
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalysisPanel = ({ content, setContent, handleAnalyze, isAnalyzing, publishingContext, setPublishingContext }: any) => {
    const contexts = [
        { id: 'journalism', label: 'Hard Journalism', icon: Newspaper, description: 'Strict, neutral, fact-based reporting.', guidelines: ['Verify all claims', 'Use multiple high-quality sources', 'Avoid emotional language'] },
        { id: 'editorial', label: 'Editorial/Op-Ed', icon: Edit, description: 'Opinion-based, but grounded in facts.', guidelines: ['Clearly state opinion', 'Support arguments with evidence', 'Acknowledge counter-arguments'] },
        { id: 'content', label: 'General Content', icon: FileText, description: 'Informal, for blogs or marketing.', guidelines: ['Ensure basic accuracy', 'Cite sources where appropriate', 'Engage the reader'] },
    ];

    const selectedContext = contexts.find(c => c.id === publishingContext);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-200">1. Select Publishing Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {contexts.map(ctx => (
                    <button
                        key={ctx.id}
                        onClick={() => setPublishingContext(ctx.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${publishingContext === ctx.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700 hover:border-gray-600 bg-gray-800'}`}
                    >
                        <ctx.icon className="w-6 h-6 mb-2 text-indigo-400" />
                        <h3 className="font-bold text-white">{ctx.label}</h3>
                        <p className="text-sm text-gray-400">{ctx.description}</p>
                    </button>
                ))}
            </div>
            {selectedContext && (
                <div className="p-4 bg-gray-900/50 rounded-lg mb-6">
                    <h4 className="font-semibold text-gray-200">Guidelines for {selectedContext.label}:</h4>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-400">
                        {selectedContext.guidelines.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                </div>
            )}
            <h2 className="text-xl font-semibold mb-4 text-gray-200">2. Paste Your Content</h2>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the article, claim, or text to analyze..."
                className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Word Count: {content.split(/\s+/).filter(Boolean).length}</p>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !content}
                    className="px-6 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center transition-all"
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 mr-2" />
                            Verify & Analyze
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const ReportPanel = ({ result, handleAutoCorrect, handleGenerateSchema }: any) => {
    if (!result) return <div className="text-center py-10"><h3 className="text-xl">No report generated yet.</h3></div>;

    const getScoreColor = (score: number) => {
        if (score > 75) return 'text-green-400';
        if (score > 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const ScoreCard = ({ title, score, scoreColor, children }: any) => (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-white">{title}</h3>
            <p className={`text-5xl font-bold my-2 ${scoreColor}`}>{score}</p>
            <div className="text-sm text-gray-400">{children}</div>
        </div>
    );

    const onExport = (format: ExportFormat) => {
        if (result) {
            handleExport(result, format);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreCard title="Final Credibility Score" score={result.final_score} scoreColor={getScoreColor(result.final_score)}>
                    Based on evidence quality and claim alignment.
                </ScoreCard>
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-white">Final Verdict</h3>
                    <p className="text-gray-300 mt-2">{result.final_verdict}</p>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4 text-white">Evidence Breakdown</h3>
                <EvidenceTable evidence={result.evidence} />
            </div>

            {result.metadata.warnings?.length > 0 && (
                <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-300 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Key Warnings</h4>
                    <ul className="list-disc list-inside mt-2 text-yellow-300/80">
                        {result.metadata.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-white">Score Metrics</h3>
                    <ul className="space-y-2">
                        {result.score_breakdown.metrics.map((m: any, i: number) => (
                            <li key={i} className="flex justify-between items-center">
                                <span className="text-gray-300">{m.name}</span>
                                <span className="font-mono text-indigo-400">{m.value}/100</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">Confidence: {result.score_breakdown.confidence_intervals.lower_bound}% - {result.score_breakdown.confidence_intervals.upper_bound}%</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-white">Analysis Metadata</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex justify-between"><span className="text-gray-400">Processing Time:</span> <span className="text-gray-200">{result.metadata.processing_time_ms}ms</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">APIs Used:</span> <span className="text-gray-200">{result.metadata.apis_used.join(', ')}</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Sources Consulted:</span> <span className="text-gray-200">{result.metadata.sources_consulted.total}</span></li>
                    </ul>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                <button onClick={handleGenerateSchema} className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                    <Code className="w-5 h-5" /> Generate Schema.org Markup
                </button>
                 <div className="relative group flex-1">
                    <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                        <Download className="w-5 h-5" /> Export Report
                    </button>
                    <div className="absolute bottom-full mb-2 w-full bg-gray-700 rounded-lg p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <button onClick={() => onExport('json-full')} className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 rounded">Full Report (JSON)</button>
                        <button onClick={() => onExport('csv-evidence')} className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 rounded">Evidence (CSV)</button>
                    </div>
                </div>
                <button onClick={() => handleAutoCorrect('balanced')} className="flex-1 px-4 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors">
                    <Bot className="w-5 h-5" /> Proceed to Auto-Editor
                </button>
            </div>
        </div>
    );
};

const EvidenceTable = ({ evidence }: any) => {
    const getIcon = (type: string) => {
        switch(type) {
            case 'expert': return <BookOpen className="w-5 h-5 text-blue-400" />;
            case 'opinion': return <Quote className="w-5 h-5 text-purple-400" />;
            case 'research': return <Newspaper className="w-5 h-5 text-green-400" />;
            default: return <LinkIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                    <tr>
                        <th scope="col" className="px-4 py-3">Type</th>
                        <th scope="col" className="px-4 py-3">Publisher</th>
                        <th scope="col" className="px-4 py-3">Quote</th>
                        <th scope="col" className="px-4 py-3 text-right">Credibility</th>
                    </tr>
                </thead>
                <tbody>
                    {evidence.map((item: any) => (
                        <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                            <td className="px-4 py-3">{getIcon(item.type)}</td>
                            <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{item.publisher}</td>
                            <td className="px-4 py-3 italic">"{item.quote}"</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.score > 75 ? 'text-green-400' : item.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{item.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

import * as Diff from 'diff';

const EditPanel = ({ result }: any) => {
    if (!result) return <div className="text-center py-10"><h3 className="text-xl">No auto-correction data available.</h3></div>;

    const DiffView = ({ diff }: { diff: Diff.Change[] }) => (
        <pre className="p-4 bg-gray-900 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">
            {diff.map((part, index) => {
                const style = part.added ? 'bg-green-900/50 text-green-300' : part.removed ? 'bg-red-900/50 text-red-300' : '';
                const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                return <span key={index} className={style}>{prefix}{part.value}</span>
            })}
        </pre>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Auto-Correction Review</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-white">Original Content</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result.originalContent}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-white">Suggested Correction</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result.correctedContent}</p>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-white">Side-by-Side Diff</h3>
                <DiffView diff={result.diff} />
            </div>
            <div className="flex justify-end gap-4">
                <button className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2">
                    <ThumbsDown className="w-5 h-5" /> Reject Changes
                </button>
                <button className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5" /> Accept & Export
                </button>
            </div>
        </div>
    );
};

export default TruScopeJournalismPlatform;