import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";

type WaveformProps = {
    audioSrc: string;
    barColor: string;
    barCount?: number;
    style?: "bars" | "rounded";
    width?: number;
    height?: number;
};

function nearestPowerOfTwo(n: number): number {
    for (const p of [32, 64, 128, 256]) if (p >= n) return p;
    return 256;
}

export const Waveform: React.FC<WaveformProps> = ({
    audioSrc,
    barColor,
    barCount = 32,
    style = "rounded",
    width = 800,
    height = 200,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const audioData = useAudioData(audioSrc);

    if (!audioData) return null;

    // Use half the barCount as samples — we'll mirror them for a centred look
    const half = Math.ceil(barCount / 2);
    const sampleCount = nearestPowerOfTwo(half);
    const halfRaw = visualizeAudio({
        fps,
        frame,
        audioData,
        numberOfSamples: sampleCount,
        smoothing: true,
    }).slice(0, half);

    // Mirror: [low..high] + reversed [high..low] → bars spread from left to right
    // with the most active (low freq / speech) bars visible throughout
    const raw = [...halfRaw, ...[...halfRaw].reverse()];

    const maxAmp = Math.max(...raw, 0.001);
    // Speech audio has very low amplitudes (0.01-0.05 range).
    // Amplify strongly so bars are always visibly animated.
    const gain = Math.min(20, 0.8 / maxAmp);

    const barWidth = (width / barCount) * 0.65;
    const gap = (width / barCount) * 0.35;
    // Minimum bar height so there's always a visible bar even during pauses
    const minBarHeight = height * 0.08;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${gap}px`,
                width: `${width}px`,
                height: `${height}px`,
            }}
        >
            {raw.map((amp, i) => {
                const boosted = Math.max(minBarHeight, Math.min(height * 0.95, amp * gain * height));
                const radius = style === "rounded" ? barWidth / 2 : 2;
                return (
                    <div
                        key={i}
                        style={{
                            width: `${barWidth}px`,
                            height: `${boosted}px`,
                            backgroundColor: barColor,
                            borderRadius: `${radius}px`,
                            opacity: 0.4 + (boosted / height) * 0.6,
                            boxShadow: `0 0 ${Math.floor((boosted / height) * 16)}px ${barColor}50`,
                        }}
                    />
                );
            })}
        </div>
    );
};
