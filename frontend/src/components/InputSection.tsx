import React, { useState } from 'react';
import { Radio, Loader2, Ghost } from 'lucide-react';

interface InputSectionProps {
    url: string;
    onUrlChange: (url: string) => void;
    disabled?: boolean;
}

export function InputSection({ url, onUrlChange, disabled }: InputSectionProps) {
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
                onUrlChange(data.url);
            }
        } catch (e) {
            console.error(e);
            alert("No recent spaces found for @elonmusk");
        } finally {
            setScouting(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl w-full flex flex-col gap-6 relative overflow-hidden group">
            {/* Decorational Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary/20 blur-[100px] rounded-full -z-10 group-hover:bg-secondary/20 transition-colors duration-700"></div>

            <div className="flex flex-col gap-2 z-10 w-full relative">
                <label htmlFor="url" className="text-sm font-medium text-gray-400 mr-auto uppercase tracking-wider ml-1">
                    Twitter Space Link
                </label>
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Radio className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        id="url"
                        className="w-full bg-black/40 border border-gray-700/50 text-white text-lg rounded-xl pl-12 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-600 relative z-10"
                        placeholder="https://twitter.com/i/spaces/..."
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        disabled={disabled || scouting}
                    />

                    <button
                        type="button"
                        onClick={handleScout}
                        disabled={scouting || disabled}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50 z-20 cursor-pointer"
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
        </div>
    );
}
