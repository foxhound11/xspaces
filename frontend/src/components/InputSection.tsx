import React, { useState } from 'react';
import { Radio, ScanLine, Loader2, Ghost } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputSectionProps {
    onProcess: (url: string) => void;
    loading: boolean;
}

export function InputSection({ onProcess, loading }: InputSectionProps) {
    const [url, setUrl] = useState('');
    const [scouting, setScouting] = useState(false);

    const handleScout = async () => {
        setScouting(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'elonmusk' })
            });

            if (!res.ok) throw new Error('Scout failed');

            const data = await res.json();
            if (data.url) {
                setUrl(data.url);
            }
        } catch (e) {
            console.error(e);
            alert("No recent spaces found for @elonmusk");
        } finally {
            setScouting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onProcess(url);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl w-full flex flex-col gap-6 relative overflow-hidden group">
            {/* Decorational Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary/20 blur-[100px] rounded-full -z-10 group-hover:bg-secondary/20 transition-colors duration-700"></div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 z-10">
                <div className="flex flex-col gap-2">
                    <label htmlFor="url" className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1">
                        Twitter Space Link
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Radio className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            id="url"
                            className="w-full bg-black/40 border border-gray-700/50 text-white text-lg rounded-xl pl-12 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-600"
                            placeholder="https://twitter.com/i/spaces/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={handleScout}
                            disabled={scouting || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-secondary transition-colors disabled:opacity-50"
                            title="Auto-find latest @elonmusk Space"
                        >
                            {scouting ? (
                                <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                            ) : (
                                <Ghost className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !url}
                    className={twMerge(
                        "relative w-full py-4 rounded-xl font-bold text-lg text-white transition-all overflow-hidden",
                        loading ? "cursor-wait opacity-80" : "hover:scale-[1.02] active:scale-[0.98]",
                        "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient"
                    )}
                    style={{
                        backgroundSize: '200% auto',
                        animation: 'gradient 3s linear infinite'
                    }}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Analyzing Audio...
                            </>
                        ) : (
                            <>
                                <ScanLine />
                                Process Space
                            </>
                        )}
                    </div>
                </button>
            </form>
        </div>
    );
}
