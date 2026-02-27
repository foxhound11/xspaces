import { useState } from 'react';
import { InputSection } from './components/InputSection';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ConfigPanel } from './components/ConfigPanel';
import { Sparkles } from 'lucide-react';

interface ThreadResult {
    thread: string;
    iterations: number;
    approved: boolean;
    feedback_history: { iteration: number; score: number; feedback: string }[];
}

function App() {
    const [result, setResult] = useState<{ markdown: string, audioPath: string, threadResult?: ThreadResult } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async (url: string) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            setResult({
                markdown: data.markdown_report,
                audioPath: data.audio_path,
                threadResult: data.thread_result || null
            });
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-start p-8 gap-12">

            {/* Header */}
            <header className="flex flex-col items-center gap-4 mt-12">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-secondary animate-pulse-slow" />
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                        Space2Thread
                    </h1>
                </div>
                <p className="text-gray-400 text-lg">Extract gold from Twitter Spaces instantly.</p>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-4xl flex flex-col gap-8 mb-20">
                <InputSection onProcess={handleProcess} loading={loading} />

                {error && (
                    <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-200 text-center">
                        {error}
                    </div>
                )}

                {result && (
                    <ResultsDisplay
                        markdown={result.markdown}
                        threadResult={result.threadResult}
                        audioPath={result.audioPath}
                    />
                )}
            </main>

            <ConfigPanel />
        </div>
    );
}

export default App;

