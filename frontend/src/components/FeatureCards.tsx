import React from 'react';
import { Download, FileText, Sparkles, MessageSquare, Video, Loader2, CheckCircle } from 'lucide-react';
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
    isCompleted?: boolean;
}

const features: Omit<FeatureCardProps, 'onClick' | 'isLoading' | 'activeFeature' | 'isCompleted'>[] = [
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
    completedFeatures?: Set<FeatureType>;
}

export function FeatureCards({ onSelectFeature, loadingFeature, hasUrl, completedFeatures = new Set() }: FeatureCardsProps) {
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
                    const isCompleted = completedFeatures.has(feature.id);

                    return (
                        <button
                            key={feature.id}
                            onClick={() => onSelectFeature(feature.id)}
                            disabled={isDisabled || (isBusy && !isCompleted)}
                            className={twMerge(
                                "relative flex flex-col items-start p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden group border bg-black/40",
                                isCompleted
                                    ? "border-emerald-500/50 bg-emerald-950/30"
                                    : feature.colorClass,
                                isDisabled
                                    ? "opacity-50 cursor-not-allowed grayscale"
                                    : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-white/20",
                                isThisLoading ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0a0f1c]" : ""
                            )}
                        >
                            {/* Color Gradient Background */}
                            <div className={twMerge(
                                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                                isCompleted
                                    ? "from-emerald-600 to-green-600 opacity-15"
                                    : feature.colorClass.split(' ').slice(0, 2).join(' '),
                                !isCompleted && !isDisabled ? "group-hover:opacity-20" : "",
                                isThisLoading ? "opacity-30 animate-pulse" : ""
                            )}></div>

                            <div className="flex items-center justify-between w-full mb-3 z-10">
                                <div className={twMerge(
                                    "p-3 rounded-xl text-white",
                                    isCompleted ? "bg-emerald-500/30" : "bg-white/10",
                                    isThisLoading ? "animate-bounce" : ""
                                )}>
                                    {isThisLoading
                                        ? <Loader2 className="w-6 h-6 animate-spin" />
                                        : isCompleted
                                            ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                                            : feature.icon
                                    }
                                </div>
                                {isCompleted && (
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                                        ✓ Done
                                    </span>
                                )}
                                {feature.comingSoon && !isCompleted && (
                                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-white/10 text-white/50 rounded-md">
                                        Coming Soon
                                    </span>
                                )}
                            </div>

                            <h4 className={twMerge(
                                "text-xl font-bold mb-1 z-10",
                                isCompleted ? "text-emerald-200" : "text-white"
                            )}>{feature.title}</h4>
                            <p className={twMerge(
                                "text-sm z-10",
                                isCompleted ? "text-emerald-400/70" : "text-gray-400"
                            )}>{isCompleted ? "Click to save again" : feature.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

