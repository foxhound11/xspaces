import ReactMarkdown from 'react-markdown';
import { Copy, Check, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ThreadResult {
    thread: string;
    iterations: number;
    approved: boolean;
    feedback_history: { iteration: number; score: number; feedback: string }[];
}

interface ResultsDisplayProps {
    markdown: string;
    threadResult?: ThreadResult | null;
}

export function ResultsDisplay({ markdown, threadResult }: ResultsDisplayProps) {
    const [copiedMd, setCopiedMd] = useState(false);
    const [copiedThread, setCopiedThread] = useState(false);
    const [activeTab, setActiveTab] = useState<'segments' | 'thread'>('segments');

    const handleCopyMd = () => {
        navigator.clipboard.writeText(markdown);
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
    };

    const handleCopyThread = () => {
        if (threadResult) {
            navigator.clipboard.writeText(threadResult.thread);
            setCopiedThread(true);
            setTimeout(() => setCopiedThread(false), 2000);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-700/50 pb-4">
                <button
                    onClick={() => setActiveTab('segments')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'segments'
                            ? 'bg-secondary/20 text-secondary border border-secondary/50'
                            : 'bg-gray-800/30 text-gray-400 hover:text-gray-200 border border-transparent'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Viral Segments
                </button>
                <button
                    onClick={() => setActiveTab('thread')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'thread'
                            ? 'bg-secondary/20 text-secondary border border-secondary/50'
                            : 'bg-gray-800/30 text-gray-400 hover:text-gray-200 border border-transparent'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Tweet Thread
                    {threadResult && (
                        threadResult.approved
                            ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                            : <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                </button>
            </div>

            {/* Viral Segments Tab */}
            {activeTab === 'segments' && (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Viral Report</h2>
                        <button
                            onClick={handleCopyMd}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm font-medium border border-gray-700"
                        >
                            {copiedMd ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedMd ? 'Copied' : 'Copy MD'}
                        </button>
                    </div>
                    <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-a:text-primary prose-strong:text-secondary prose-table:border-collapse prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-tr:border-b prose-tr:border-gray-800">
                        <ReactMarkdown>{markdown}</ReactMarkdown>
                    </div>
                </>
            )}

            {/* Tweet Thread Tab */}
            {activeTab === 'thread' && (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">Tweet Thread</h2>
                            {threadResult && (
                                <span className={`text-xs px-2 py-1 rounded-full ${threadResult.approved
                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                    }`}>
                                    {threadResult.approved ? '✓ Approved' : `⚠ ${threadResult.iterations} iterations`}
                                </span>
                            )}
                        </div>
                        {threadResult && (
                            <button
                                onClick={handleCopyThread}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm font-medium border border-gray-700"
                            >
                                {copiedThread ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copiedThread ? 'Copied' : 'Copy Thread'}
                            </button>
                        )}
                    </div>

                    {threadResult ? (
                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                            <pre className="whitespace-pre-wrap text-gray-200 font-sans text-base leading-relaxed">
                                {threadResult.thread}
                            </pre>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Thread generation in progress...</p>
                        </div>
                    )}

                    {/* Feedback History (if any) */}
                    {threadResult && threadResult.feedback_history.length > 0 && (
                        <details className="mt-4">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300">
                                View feedback history ({threadResult.feedback_history.length} revision{threadResult.feedback_history.length > 1 ? 's' : ''})
                            </summary>
                            <div className="mt-3 space-y-2">
                                {threadResult.feedback_history.map((item, idx) => (
                                    <div key={idx} className="text-sm bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                        <span className="text-gray-400">Iteration {item.iteration}:</span>
                                        <span className="ml-2 text-gray-300">{item.feedback}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </>
            )}
        </div>
    );
}
