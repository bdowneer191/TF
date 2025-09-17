import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InputSection, { AnalysisMethod } from './components/InputSection';
import HistoryView from './components/HistoryView';
import { runFactCheckOrchestrator, fetchNewsData } from './services/geminiService';
import { areAllKeysProvided } from './services/apiKeyService';
import { saveReportToHistory } from './services/historyService';
import { trackFactCheckUsage } from './utils/tracking';
import { AnalysisError } from './types';
import { FactCheckReport } from './types/factCheck';
import { LightBulbIcon, ExportIcon } from './components/icons';
import SettingsModal from './components/SettingsModal';
import { handleExport, ExportFormat } from './utils/export';


const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-12 w-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-slate-200">Analyzing Content...</h2>
        <p className="text-slate-400 mt-1">Our AI is running a deep analysis. This may take a moment.</p>
    </div>
);

type AppView = 'checker' | 'history';

const App: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<AnalysisError | null>(null);
    const [analysisResult, setAnalysisResult] = useState<FactCheckReport | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>('checker');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const handleAnalyze = useCallback(async (method: AnalysisMethod) => {
        if (!inputText.trim()) {
            setError({ message: 'Please enter some content to analyze.' });
            return;
        }

        if (!areAllKeysProvided()) {
            setError({ message: 'One or more API keys are missing. Please complete the configuration in the Settings panel.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        const startTime = Date.now();

        try {
            let report: FactCheckReport;
            if (method === 'newsdata') {
                const newsArticles = await fetchNewsData(inputText);
                report = {
                    final_verdict: newsArticles.length > 0
                        ? `Found ${newsArticles.length} recent news article(s) related to the topic.`
                        : "No recent news articles found for the given topic.",
                    final_score: 50, // Neutral score
                    evidence: newsArticles.map((article, index) => ({
                        id: `news-${index}`,
                        publisher: article.source,
                        url: article.link,
                        quote: article.title,
                        score: 65,
                        type: 'news' as 'news',
                    })),
                    score_breakdown: {
                        final_score_formula: "Not applicable for News Coverage mode.",
                        metrics: [],
                        confidence_intervals: { lower_bound: 45, upper_bound: 55 }
                    },
                    metadata: {
                        method_used: "Recent News Coverage",
                        processing_time_ms: Date.now() - startTime,
                        apis_used: ["newsdata.io"],
                        sources_consulted: { total: newsArticles.length, high_credibility: 0, conflicting: 0 },
                        warnings: newsArticles.length === 0 ? ['No articles were identified.'] : [],
                    },
                    searchEvidence: undefined,
                };
            } else {
                report = await runFactCheckOrchestrator(inputText, method);
            }
            setAnalysisResult(report);
            saveReportToHistory(inputText, report);
            trackFactCheckUsage(report); // Track performance and usage metrics

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError({ message: err.message });
            } else {
                setError({ message: 'An unknown error occurred.' });
            }
        } finally {
            setIsLoading(false);
        }
    }, [inputText]);

    const handleSelectReport = (report: FactCheckReport, claimText: string) => {
        setAnalysisResult(report);
        setInputText(claimText);
        setCurrentView('checker');
        setError(null);
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onExportClick = (format: ExportFormat) => {
        if (analysisResult) {
            handleExport(analysisResult, format);
        }
        setIsExportMenuOpen(false);
    };

    const renderMainContent = () => {
        if (currentView === 'history') {
            return <HistoryView onSelectReport={handleSelectReport} />;
        }

        return (
            <>
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Content Fact-Checker</h2>
                        <p className="text-slate-400 mt-1">Enter any article, claim, or statement to get an instant credibility analysis.</p>
                    </div>

                    {analysisResult && !isLoading && (
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(prev => !prev)}
                                className="flex items-center gap-2 px-4 py-2 font-semibold text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                                aria-haspopup="true"
                                aria-expanded={isExportMenuOpen}
                                aria-label="Export report"
                            >
                                <ExportIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                                    <ul className="py-1" role="menu">
                                        <li className="text-xs text-slate-400 px-3 py-1 font-semibold uppercase">Export Options</li>
                                        <li>
                                            <button onClick={() => onExportClick('json-full')} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">Full Report (JSON)</button>
                                        </li>
                                        <li>
                                            <button onClick={() => onExportClick('json-summary')} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">Summary (JSON)</button>
                                        </li>
                                        <li>
                                            <button onClick={() => onExportClick('csv-evidence')} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">Evidence (CSV)</button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </header>
                
                <InputSection 
                    inputText={inputText}
                    onTextChange={setInputText}
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                />
                
                {error && (
                    <div className="mt-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                        <span className="font-semibold">Error:</span> {error.message}
                    </div>
                )}

                <div className="mt-8 min-h-[400px]">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : analysisResult ? (
                        <Dashboard result={analysisResult} />
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center text-slate-500 pt-16">
                            <LightBulbIcon className="w-16 h-16 text-slate-600" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-300">Ready to Verify</h3>
                            <p className="max-w-sm mt-1">Enter content above to start a comprehensive fact-check with industry-grade verification.</p>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen flex bg-slate-900">
            <Sidebar 
                onSettingsClick={() => setIsSettingsModalOpen(true)}
                currentView={currentView}
                onNavigate={setCurrentView}
            />
            <main className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {renderMainContent()}
                </div>
            </main>
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
};

export default App;
