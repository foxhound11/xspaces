import React, { useState } from 'react';
import { Film, Upload, Palette, Type, Loader2, Download, X } from 'lucide-react';

interface ClipStudioProps {
    audioPath: string;
    segmentText: string;
    startTime: number;
    endTime: number;
    onClose: () => void;
}

const LAYOUTS = [
    {
        id: 'centered_waveform',
        name: 'Centered Waveform',
        description: 'Big waveform in the center with title and captions',
        emoji: '📊',
    },
    {
        id: 'split_screen',
        name: 'Split Screen',
        description: 'Image on left, waveform + captions on right',
        emoji: '📱',
    },
    {
        id: 'podcast_card',
        name: 'Podcast Card',
        description: 'Clean card with profile pic and waveform',
        emoji: '🎙️',
    },
];

const DEFAULT_COLORS = {
    background: '#0a0a0a',
    waveform: '#a855f7',
    text: '#ffffff',
    accent: '#3b82f6',
};

export function ClipStudio({ audioPath, segmentText, startTime, endTime, onClose }: ClipStudioProps) {
    const [layout, setLayout] = useState('centered_waveform');
    const [title, setTitle] = useState('Space2Thread');
    const [captionText, setCaptionText] = useState(segmentText);
    const [colors, setColors] = useState(DEFAULT_COLORS);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [logoFilename, setLogoFilename] = useState<string | null>(null);
    const [logoPosition, setLogoPosition] = useState('top-right');
    const [rendering, setRendering] = useState(false);
    const [clipUrl, setClipUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/upload-logo', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setLogoPath(data.logo_path);
            setLogoFilename(data.filename);
        } catch (err) {
            console.error(err);
            setError('Failed to upload logo');
        }
    };

    const handleRender = async () => {
        setRendering(true);
        setError(null);
        setClipUrl(null);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/render-clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_path: audioPath,
                    start_time: startTime,
                    end_time: endTime,
                    layout,
                    title,
                    caption_text: captionText,
                    logo_path: logoPath,
                    logo_position: logoPosition,
                    colors,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Render failed');
            }

            const data = await res.json();
            setClipUrl(`http://127.0.0.1:8000${data.clip_url}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Render failed');
        } finally {
            setRendering(false);
        }
    };

    const duration = endTime - startTime;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-panel rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Film className="w-7 h-7 text-secondary" />
                    <h2 className="text-2xl font-bold text-white">Clip Studio</h2>
                    <span className="text-sm text-gray-400 ml-auto">{duration.toFixed(0)}s segment</span>
                </div>

                {/* Layout Selection */}
                <div className="mb-8">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 block">
                        Layout
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {LAYOUTS.map((l) => (
                            <button
                                key={l.id}
                                onClick={() => setLayout(l.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${layout === l.id
                                    ? 'border-secondary bg-secondary/10'
                                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                                    }`}
                            >
                                <span className="text-2xl">{l.emoji}</span>
                                <span className="text-sm font-semibold text-white">{l.name}</span>
                                <span className="text-xs text-gray-400">{l.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Type className="w-4 h-4" /> Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        placeholder="Clip title..."
                    />
                </div>

                {/* Logo Upload */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Logo / Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-colors text-sm text-gray-300">
                            {logoFilename ? `✓ ${logoFilename}` : 'Choose file...'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                        {logoPath && (
                            <select
                                value={logoPosition}
                                onChange={(e) => setLogoPosition(e.target.value)}
                                className="bg-black/40 border border-gray-700/50 text-white rounded-xl px-3 py-3 text-sm focus:outline-none"
                            >
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Colours */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Colors
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {Object.entries(colors).map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 capitalize">{key}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) =>
                                            setColors((prev) => ({ ...prev, [key]: e.target.value }))
                                        }
                                        className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">{value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Caption Text */}
                <div className="mb-8">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 block">
                        Caption Text
                    </label>
                    <textarea
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-gray-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm resize-none"
                        placeholder="Caption text that will appear on the clip..."
                    />
                </div>

                {/* Render Button */}
                {!clipUrl ? (
                    <button
                        onClick={handleRender}
                        disabled={rendering}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all overflow-hidden ${rendering
                            ? 'bg-gray-700 cursor-wait'
                            : 'bg-gradient-to-r from-primary via-secondary to-primary hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {rendering ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Rendering clip... (this may take a minute)
                                </>
                            ) : (
                                <>
                                    <Film />
                                    Render Clip
                                </>
                            )}
                        </div>
                    </button>
                ) : (
                    <div className="space-y-4">
                        {/* Video Preview */}
                        <video
                            src={clipUrl}
                            controls
                            className="w-full rounded-xl border border-gray-700/50"
                        />

                        {/* Download Button */}
                        <a
                            href={clipUrl}
                            download
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-green-600 to-green-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Download />
                            Download Clip
                        </a>

                        {/* Render Another */}
                        <button
                            onClick={() => setClipUrl(null)}
                            className="w-full py-3 rounded-xl font-medium text-gray-400 border border-gray-700/50 hover:bg-gray-800/50 transition-all"
                        >
                            Render with different settings
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-900/20 border border-red-500/50 text-red-300 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
