import React from 'react';
import { Download, FileText, Sparkles, MessageSquare, Video, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type FeatureType = 'download' | 'transcribe' | 'extract' | 'thread' | 'video';

interface FeatureCardProps {
    id: FeatureType;
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
    comingSoon?: boolean;
    activeFeature: FeatureType | null;
}

const features: Omit<FeatureCardProps, 'onClick' | 'isLoading' | 'activeFeature'>[] = [
    {
        id: 'download',
        title: 'Download MP3',
        description: 'Just get the audio file, quickly.',
        icon: <Download className="w-6 h-6" />,
        colorClass: 'from-emerald-600 to-teal-600 border-emerald-500/30'
    },
    {
        id: 'transcribe',
        title: 'Transcribe Text',
        description: 'Read the full conversation.',
        icon: <FileText className="w-6 h-6" />,
        colorClass: 'from-blue-600 to-cyan-600 border-blue-500/30'
    },
    {
        id: 'extract',
        title: 'Extract Highlights',
        description: 'Find the most viral moments.',
        icon: <Sparkles className="w-6 h-6" />,
        colorClass: 'from-purple-600 to-pink-600 border-purple-500/30'
    },
    {
        id: 'thread',
        title: 'Tweet Thread',
        description: 'Generate an engaging thread.',
        icon: <MessageSquare className="w-6 h-6" />,
        colorClass: 'from-orange-500 to-rose-500 border-orange-500/30'
    },
    {
        id: 'video',
        title: 'Download Video',
        description: 'Download YouTube videos in any quality.',
        icon: <Video className="w-6 h-6" />,
        colorClass: 'from-red-600 to-rose-600 border-red-500/30'
    }
];

interface FeatureCardsProps {
    onSelectFeature: (feature: FeatureType) => void;
    loadingFeature: FeatureType | null;
    hasUrl: boolean;
}

export function FeatureCards({ onSelectFeature, loadingFeature, hasUrl }: FeatureCardsProps) {
    return (
        <div className="w-full flex flex-col gap-4 z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100">
            <h3 className="text-gray-400 font-medium tracking-wider text-sm uppercase pl-1">
                Select Action
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => {
                    const isBusy = loadingFeature !== null;
                    const isThisLoading = loadingFeature === feature.id;
                    const isDisabled = feature.disabled || (!hasUrl && !isThisLoading);

                    return (
                        <button
                            key={feature.id}
                            onClick={() => onSelectFeature(feature.id)}
                            disabled={isDisabled || isBusy}
                            className={twMerge(
                                "relative flex flex-col items-start p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden group border bg-black/40",
                                feature.colorClass,
                                isDisabled
                                    ? "opacity-50 cursor-not-allowed grayscale"
                                    : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-white/20",
                                isThisLoading ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0a0f1c]" : ""
                            )}
                        >
                            {/* Color Gradient Background (Hidden until hover unless active) */}
                            <div className={twMerge(
                                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                                feature.colorClass.split(' ').slice(0, 2).join(' '),
                                isDisabled ? "" : "group-hover:opacity-20",
                                isThisLoading ? "opacity-30 animate-pulse" : ""
                            )}></div>

                            <div className="flex items-center justify-between w-full mb-3 z-10">
                                <div className={twMerge(
                                    "p-3 rounded-xl bg-white/10 text-white",
                                    isThisLoading ? "animate-bounce" : ""
                                )}>
                                    {isThisLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : feature.icon}
                                </div>
                                {feature.comingSoon && (
                                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-white/10 text-white/50 rounded-md">
                                        Coming Soon
                                    </span>
                                )}
                            </div>

                            <h4 className="text-xl font-bold text-white mb-1 z-10">{feature.title}</h4>
                            <p className="text-gray-400 text-sm z-10">{feature.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
