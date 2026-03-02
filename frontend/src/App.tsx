import { useState } from 'react';
import { InputSection } from './components/InputSection';
import { FeatureCards, type FeatureType } from './components/FeatureCards';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ConfigPanel } from './components/ConfigPanel';
import { Sparkles, Loader2 } from 'lucide-react';

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

function App() {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [loadingFeature, setLoadingFeature] = useState<FeatureType | null>(null);
    const [error, setError] = useState<string | null>(null);

    const triggerFileSave = (downloadUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `http://127.0.0.1:8000${downloadUrl}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFeatureSelect = async (feature: FeatureType) => {
        if (!url.trim()) return;

        setLoadingFeature(feature);
        setError(null);
        setResult(null);

        try {
            let response;
            let endpoint = '';

            // Map features to specific endpoints
            if (feature === 'download') endpoint = '/api/download';
            else if (feature === 'transcribe') endpoint = '/api/transcribe';
            else if (feature === 'extract' || feature === 'thread') endpoint = '/api/process';

            if (!endpoint) throw new Error("Feature not implemented yet");

            response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle specific feature responses
            if (feature === 'download') {
                setResult({
                    type: 'download',
                    filename: data.filename,
                    downloadUrl: data.download_url
                });
                triggerFileSave(data.download_url, data.filename);
            }
            else if (feature === 'transcribe') {
                setResult({
                    type: 'transcribe',
                    transcript: data.transcript,
                    audioPath: data.audio_path,
                    filename: data.filename,
                    downloadUrl: data.download_url
                });
            }
            else if (feature === 'extract' || feature === 'thread') {
                setResult({
                    type: feature, // Remember which tab should be active by default
                    markdown: data.markdown_report,
                    audioPath: data.audio_path,
                    threadResult: data.thread_result || null
                });
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoadingFeature(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-start p-8 gap-8">

            {/* Header */}
            <header className="flex flex-col items-center gap-4 mt-8">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-secondary animate-pulse-slow" />
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                        Space2Thread
                    </h1>
                </div>
                <p className="text-gray-400 text-lg">Extract gold from Twitter Spaces modularly.</p>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-5xl flex flex-col gap-8 mb-20 relative">

                {/* 1. URL Input */}
                <InputSection
                    url={url}
                    onUrlChange={(newUrl) => {
                        setUrl(newUrl);
                        // Reset results when URL changes to prevent confusion
                        setResult(null);
                        setError(null);
                    }}
                    disabled={loadingFeature !== null}
                />

                {/* 2. Feature Selection Grid */}
                <FeatureCards
                    onSelectFeature={handleFeatureSelect}
                    loadingFeature={loadingFeature}
                    hasUrl={url.trim().length > 0}
                />

                {/* Loading State Overlay */}
                {loadingFeature && (
                    <div className="w-full p-6 rounded-2xl bg-blue-900/20 border border-blue-500/30 text-blue-300 flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-medium text-lg">
                            {loadingFeature === 'download' && "Downloading MP3... this depends on Space length."}
                            {loadingFeature === 'transcribe' && "Transcribing Space... reading the audio."}
                            {loadingFeature === 'extract' && "Extracting highlights... finding the viral moments."}
                            {loadingFeature === 'thread' && "Writing Tweet Thread... analyzing and drafting iterations."}
                        </span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="w-full p-6 rounded-2xl bg-red-900/20 border border-red-500/50 text-red-200 text-center animate-in fade-in slide-in-from-bottom-4">
                        {error}
                    </div>
                )}

                {/* 3. Results Area */}
                {result && !loadingFeature && (
                    <ResultsDisplay result={result} />
                )}
            </main>

            <ConfigPanel />
        </div>
    );
}

export default App;
