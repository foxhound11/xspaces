import ReactMarkdown from 'react-markdown';
import { Copy, Check, MessageSquare, AlertCircle, CheckCircle2, Film, Download, FileText, Sparkles, CheckCircle, Music } from 'lucide-react';
import { useState } from 'react';
import { ClipStudio } from './ClipStudio';
import type { FeatureType } from './FeatureCards';

interface ThreadResult {
    thread: string;
    iterations: number;
    approved: boolean;
    feedback_history: { iteration: number; score: number; feedback: string }[];
}

interface ProcessResult {
    type: FeatureType;
    transcript?: string;
    markdown?: string;
    threadResult?: ThreadResult;
    audioPath?: string;
    filename?: string;
    downloadUrl?: string;
}

interface ResultsDisplayProps {
    result: ProcessResult;
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
    const [copiedMd, setCopiedMd] = useState(false);
    const [copiedThread, setCopiedThread] = useState(false);
    const [copiedTranscript, setCopiedTranscript] = useState(false);

    // Default active tab to whatever feature was just requested
    const defaultTab = result.type === 'thread' ? 'thread' : 'segments';
    const [activeTab, setActiveTab] = useState<'segments' | 'thread'>(defaultTab);

    const [clipStudioOpen, setClipStudioOpen] = useState(false);

    const handleCopy = (text: string, setter: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const triggerFileSave = () => {
        if (!result.downloadUrl || !result.filename) return;
        const link = document.createElement('a');
        link.href = `http://127.0.0.1:8000${result.downloadUrl}`;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Download Mode
    if (result.type === 'download') {
        return (
            <div className="glass-panel p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 bg-emerald-900/10 border-emerald-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-emerald-300">Download Complete!</h2>
                            <p className="flex items-center gap-2 text-emerald-400/70 text-sm mt-1">
                                <Music className="w-4 h-4" />
                                {result.filename}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={triggerFileSave}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all hover:scale-105 active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Save Again
                    </button>
                </div>
            </div>
        );
    }

    // 2. Transcribe Mode
    if (result.type === 'transcribe') {
        return (
            <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Full Transcript</h2>
                    </div>
                    <button
                        onClick={() => handleCopy(result.transcript || '', setCopiedTranscript)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm font-medium border border-gray-700"
                    >
                        {copiedTranscript ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copiedTranscript ? 'Copied' : 'Copy All Text'}
                    </button>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 max-h-[600px] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-300 font-sans text-base leading-relaxed">
                        {result.transcript}
                    </p>
                </div>
            </div>
        );
    }

    // 3. Extract & Thread Modes (Shared UI with Tabs)
    return (
        <div className="glass-panel p-8 rounded-2xl w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-700/50 pb-4">
                <button
                    onClick={() => setActiveTab('segments')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'segments'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'bg-gray-800/30 text-gray-400 hover:text-gray-200 border border-transparent'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Viral Segments
                </button>

                {result.threadResult && (
                    <button
                        onClick={() => setActiveTab('thread')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'thread'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                            : 'bg-gray-800/30 text-gray-400 hover:text-gray-200 border border-transparent'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Tweet Thread
                        {result.threadResult.approved
                            ? <CheckCircle2 className="w-4 h-4 text-green-400 ml-1" />
                            : <AlertCircle className="w-4 h-4 text-yellow-400 ml-1" />
                        }
                    </button>
                )}
            </div>

            {/* Viral Segments Tab */}
            {activeTab === 'segments' && result.markdown && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Highlights Report</h2>
                        <button
                            onClick={() => handleCopy(result.markdown || '', setCopiedMd)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm font-medium border border-gray-700"
                        >
                            {copiedMd ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedMd ? 'Copied' : 'Copy MD'}
                        </button>
                    </div>

                    <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-a:text-purple-400 prose-strong:text-purple-300 prose-table:border-collapse prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-tr:border-b prose-tr:border-gray-800 bg-black/20 p-6 rounded-xl border border-white/5">
                        <ReactMarkdown>{result.markdown}</ReactMarkdown>
                    </div>

                    {/* Create Clip Button */}
                    {result.audioPath && (
                        <div className="mt-8 pt-6 border-t border-gray-700/50">
                            <button
                                onClick={() => setClipStudioOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-all font-medium border border-gray-600 w-fit"
                            >
                                <Film className="w-5 h-5 text-gray-400" />
                                Create Video Clip
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Tweet Thread Tab */}
            {activeTab === 'thread' && result.threadResult && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">Tweet Thread</h2>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${result.threadResult.approved
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                }`}>
                                {result.threadResult.approved ? '✓ Approved by AI Judge' : `⚠ ${result.threadResult.iterations} draft attempts`}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(result.threadResult!.thread, setCopiedThread)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm font-medium border border-gray-700"
                        >
                            {copiedThread ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedThread ? 'Copied' : 'Copy Thread'}
                        </button>
                    </div>

                    <div className="bg-[#15202b] rounded-xl p-8 border border-gray-700/50 shadow-inner">
                        <pre className="whitespace-pre-wrap text-gray-200 font-sans text-[17px] leading-[1.6] max-w-2xl">
                            {result.threadResult.thread}
                        </pre>
                    </div>

                    {/* Feedback History */}
                    {result.threadResult.feedback_history.length > 0 && (
                        <details className="mt-6">
                            <summary className="text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-300 transition-colors inline-flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                View generation history ({result.threadResult.feedback_history.length} revision{result.threadResult.feedback_history.length > 1 ? 's' : ''})
                            </summary>
                            <div className="mt-4 space-y-3">
                                {result.threadResult.feedback_history.map((item, idx) => (
                                    <div key={idx} className="text-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                                        <div className="font-bold text-gray-400 mb-1">Draft {item.iteration} Feedback:</div>
                                        <div className="text-gray-300 leading-relaxed">{item.feedback}</div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {/* Clip Studio Modal */}
            {clipStudioOpen && result.audioPath && (
                <ClipStudio
                    audioPath={result.audioPath}
                    segmentText={result.markdown?.split('# Full Transcript')[0] || ''}
                    startTime={0}
                    endTime={90}
                    onClose={() => setClipStudioOpen(false)}
                />
            )}
        </div>
    );
}
