import { useState } from 'react';
import { InputSection } from './components/InputSection';
import { FeatureCards, type FeatureType } from './components/FeatureCards';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ConfigPanel } from './components/ConfigPanel';
import { Sparkles, Loader2, Video, CheckCircle, Download } from 'lucide-react';

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

interface DownloadedFile {
    filename: string;
    downloadUrl: string;
    audioPath?: string;
}

function App() {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [loadingFeature, setLoadingFeature] = useState<FeatureType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<string>('');
    const [downloadPhase, setDownloadPhase] = useState<'download' | 'convert' | null>(null);
    const [fragmentInfo, setFragmentInfo] = useState<string>('');

    // Pipeline state — persists after download
    const [downloadedFile, setDownloadedFile] = useState<DownloadedFile | null>(null);
    const [completedFeatures, setCompletedFeatures] = useState<Set<FeatureType>>(new Set());

    // Video download state
    const [videoFormats, setVideoFormats] = useState<{title: string, thumbnail: string, duration: number, qualities: {height: number, label: string}[]} | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoDownloading, setVideoDownloading] = useState(false);
    const [videoResult, setVideoResult] = useState<{filename: string} | null>(null);

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

        // If download is already completed and they click it again, just re-save the file
        if (feature === 'download' && downloadedFile) {
            triggerFileSave(downloadedFile.downloadUrl, downloadedFile.filename);
            return;
        }

        setLoadingFeature(feature);
        setError(null);
        setResult(null);
        setDownloadProgress(null);
        setDownloadStatus('');
        setDownloadPhase(null);
        setFragmentInfo('');

        try {
            let response;
            let endpoint = '';

            // Map features to specific endpoints
            if (feature === 'download') endpoint = '/api/download';
            else if (feature === 'transcribe') endpoint = '/api/transcribe';
            else if (feature === 'extract' || feature === 'thread') endpoint = '/api/process';
            else if (feature === 'video') {
                // Video feature: fetch formats first, then show quality picker
                setLoadingFeature(null);
                setVideoLoading(true);
                setVideoFormats(null);
                setVideoResult(null);
                try {
                    const fmtRes = await fetch('http://127.0.0.1:8000/api/video-formats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                    });
                    if (!fmtRes.ok) {
                        const errData = await fmtRes.json().catch(() => ({}));
                        throw new Error(errData.detail || 'Failed to fetch formats');
                    }
                    const fmtData = await fmtRes.json();
                    setVideoFormats(fmtData);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch video formats');
                } finally {
                    setVideoLoading(false);
                }
                return;
            }

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

            if (feature === 'download') {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) throw new Error("Failed to read stream");

                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const data = JSON.parse(line);
                            if (data.status === 'downloading') {
                                setDownloadPhase('download');
                                setDownloadProgress(data.progress);
                                // Show fragment info if available
                                const fragText = data.total_fragments > 0
                                    ? `Fragment ${data.fragment}/${data.total_fragments} — `
                                    : '';
                                setFragmentInfo(fragText);
                                setDownloadStatus(`${fragText}${data.progress}% (${data.speed})`);
                            } else if (data.status === 'processing') {
                                setDownloadPhase('convert');
                                setDownloadProgress(100);
                                setFragmentInfo('');
                                setDownloadStatus('Converting to MP3...');
                            } else if (data.status === 'completed') {
                                const fileInfo: DownloadedFile = {
                                    filename: data.filename,
                                    downloadUrl: `/api/files/${data.filename}`,
                                    audioPath: data.filepath,
                                };
                                setDownloadedFile(fileInfo);
                                setCompletedFeatures(prev => new Set(prev).add('download'));
                                setResult({
                                    type: 'download',
                                    filename: data.filename,
                                    downloadUrl: `/api/files/${data.filename}`
                                });
                                triggerFileSave(`/api/files/${data.filename}`, data.filename);
                                setDownloadStatus('Complete!');
                                setDownloadPhase(null);
                            } else if (data.status === 'error') {
                                throw new Error(data.message || 'Download error');
                            }
                        } catch (e) {
                            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                                throw e;
                            }
                        }
                    }
                }
            } else {
                const data = await response.json();

                // Handle specific feature responses
                if (feature === 'transcribe') {
                    setCompletedFeatures(prev => new Set(prev).add('transcribe'));
                    setResult({
                        type: 'transcribe',
                        transcript: data.transcript,
                        audioPath: data.audio_path,
                        filename: data.filename,
                        downloadUrl: data.download_url
                    });
                }
                else if (feature === 'extract' || feature === 'thread') {
                    setCompletedFeatures(prev => new Set(prev).add(feature));
                    setResult({
                        type: feature, // Remember which tab should be active by default
                        markdown: data.markdown_report,
                        audioPath: data.audio_path,
                        threadResult: data.thread_result || null
                    });
                }
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoadingFeature(null);
            setTimeout(() => {
                setDownloadProgress(null);
                setDownloadPhase(null);
                setFragmentInfo('');
            }, 3000);
        }
    };

    const handleVideoDownload = async (quality: string) => {
        if (!url.trim()) return;
        setVideoDownloading(true);
        setVideoResult(null);
        setDownloadProgress(null);
        setDownloadStatus('');
        setDownloadPhase(null);
        setError(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/download-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, quality }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('Failed to read stream');

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.status === 'downloading') {
                            setDownloadProgress(data.progress);
                            setDownloadStatus(`Downloading: ${data.progress}% (${data.speed})`);
                        } else if (data.status === 'processing') {
                            setDownloadProgress(100);
                            setDownloadStatus('Merging video and audio...');
                        } else if (data.status === 'completed') {
                            setVideoResult({ filename: data.filename });
                            triggerFileSave(`/api/videos/${data.filename}`, data.filename);
                            setDownloadStatus('Complete!');
                        } else if (data.status === 'error') {
                            throw new Error(data.message || 'Download error');
                        }
                    } catch (e) {
                        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                            throw e;
                        }
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Video download failed');
        } finally {
            setVideoDownloading(false);
            setTimeout(() => setDownloadProgress(null), 3000);
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
                        // Reset everything when URL changes
                        setResult(null);
                        setError(null);
                        setVideoFormats(null);
                        setVideoResult(null);
                        setDownloadedFile(null);
                        setCompletedFeatures(new Set());
                    }}
                    disabled={loadingFeature !== null || videoDownloading}
                />

                {/* 2. Feature Selection Grid */}
                <FeatureCards
                    onSelectFeature={handleFeatureSelect}
                    loadingFeature={loadingFeature}
                    hasUrl={url.trim().length > 0}
                    completedFeatures={completedFeatures}
                />

                {/* Loading State with Two-Phase Progress */}
                {loadingFeature && (
                    <div className="w-full p-6 rounded-2xl bg-blue-900/20 border border-blue-500/30 text-blue-300 flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="font-medium text-lg">
                                {loadingFeature === 'download' && (downloadStatus || "Starting download...")}
                                {loadingFeature === 'transcribe' && "Transcribing Space... reading the audio."}
                                {loadingFeature === 'extract' && "Extracting highlights... finding the viral moments."}
                                {loadingFeature === 'thread' && "Writing Tweet Thread... analyzing and drafting iterations."}
                            </span>
                        </div>

                        {/* Two-phase progress bar for downloads */}
                        {loadingFeature === 'download' && (
                            <div className="w-full max-w-lg flex flex-col gap-3">
                                {/* Phase indicators */}
                                <div className="flex items-center gap-6 text-sm">
                                    <div className={`flex items-center gap-2 transition-all ${downloadPhase === 'download' ? 'text-blue-300 font-bold' : downloadPhase === 'convert' ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {downloadPhase === 'convert' ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <div className={`w-4 h-4 rounded-full border-2 ${downloadPhase === 'download' ? 'border-blue-400 bg-blue-400/30' : 'border-gray-600'}`} />
                                        )}
                                        <span>Download</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-700" />
                                    <div className={`flex items-center gap-2 transition-all ${downloadPhase === 'convert' ? 'text-blue-300 font-bold' : 'text-gray-500'}`}>
                                        <div className={`w-4 h-4 rounded-full border-2 ${downloadPhase === 'convert' ? 'border-blue-400 bg-blue-400/30 animate-pulse' : 'border-gray-600'}`} />
                                        <span>Convert to MP3</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {downloadProgress !== null && (
                                    <div className="w-full bg-gray-900/50 rounded-full h-3 overflow-hidden border border-blue-500/20 relative">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ease-out absolute left-0 top-0 ${
                                                downloadPhase === 'convert'
                                                    ? 'bg-gradient-to-r from-emerald-600 to-green-400 animate-pulse w-full'
                                                    : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                                            }`}
                                            style={downloadPhase !== 'convert' ? { width: `${downloadProgress}%` } : undefined}
                                        />
                                    </div>
                                )}

                                {/* Fragment detail text */}
                                {fragmentInfo && downloadPhase === 'download' && (
                                    <p className="text-xs text-gray-500 text-center">{fragmentInfo}{downloadProgress}%</p>
                                )}
                            </div>
                        )}
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

                {/* 4. Video Quality Selector */}
                {(videoLoading || videoFormats || videoDownloading || videoResult) && (
                    <div className="w-full rounded-2xl bg-gradient-to-br from-red-950/30 to-rose-950/20 border border-red-500/20 p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                                <Video className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Download Video</h2>
                        </div>

                        {/* Loading formats */}
                        {videoLoading && (
                            <div className="flex items-center gap-3 text-red-300">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Fetching available qualities...</span>
                            </div>
                        )}

                        {/* Video info + Quality picker */}
                        {videoFormats && !videoDownloading && !videoResult && (
                            <div className="flex flex-col gap-6">
                                {/* Video metadata */}
                                <div className="flex gap-4 items-start">
                                    {videoFormats.thumbnail && (
                                        <img
                                            src={videoFormats.thumbnail}
                                            alt="Thumbnail"
                                            className="w-40 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white leading-tight">{videoFormats.title}</h3>
                                        {videoFormats.duration > 0 && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                {Math.floor(videoFormats.duration / 60)}:{String(videoFormats.duration % 60).padStart(2, '0')} minutes
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Quality buttons */}
                                <div>
                                    <p className="text-gray-400 text-sm font-medium mb-3">Select Quality</p>
                                    <div className="flex flex-wrap gap-3">
                                        {videoFormats.qualities.map((q) => (
                                            <button
                                                key={q.height}
                                                onClick={() => handleVideoDownload(String(q.height))}
                                                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200
                                                    bg-red-600/20 text-red-300 border border-red-500/30
                                                    hover:bg-red-600/40 hover:border-red-400/50 hover:scale-105 active:scale-95
                                                    cursor-pointer"
                                            >
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Downloading progress */}
                        {videoDownloading && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3 text-red-300">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-medium">{downloadStatus || 'Starting video download...'}</span>
                                </div>
                                {downloadProgress !== null && (
                                    <div className="w-full max-w-md bg-gray-900/50 rounded-full h-3 overflow-hidden border border-red-500/20 relative">
                                        <div
                                            className="bg-gradient-to-r from-red-600 to-rose-400 h-full rounded-full transition-all duration-300 ease-out absolute left-0 top-0"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Download complete */}
                        {videoResult && !videoDownloading && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                                    <div>
                                        <p className="text-emerald-300 font-bold text-lg">Video Downloaded!</p>
                                        <p className="text-emerald-400/70 text-sm">{videoResult.filename}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => triggerFileSave(`/api/videos/${videoResult.filename}`, videoResult.filename)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    Save Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <ConfigPanel />
        </div>
    );
}

export default App;
