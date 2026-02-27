import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    Audio,
    staticFile,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";

type WaveformProps = {
    audioSrc: string;
    barColor: string;
    barCount?: number;
    style?: "bars" | "rounded";
    width?: number;
    height?: number;
};

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

    if (!audioData) {
        return null;
    }

    const visualization = visualizeAudio({
        fps,
        frame,
        audioData,
        numberOfSamples: barCount,
        smoothing: true,
    });

    const barWidth = (width / barCount) * 0.7;
    const gap = (width / barCount) * 0.3;

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
            {visualization.map((amp, i) => {
                const barHeight = Math.max(4, amp * height * 0.9);
                const radius = style === "rounded" ? barWidth / 2 : 2;

                return (
                    <div
                        key={i}
                        style={{
                            width: `${barWidth}px`,
                            height: `${barHeight}px`,
                            backgroundColor: barColor,
                            borderRadius: `${radius}px`,
                            transition: "height 0.05s ease",
                            opacity: 0.7 + amp * 0.3,
                            boxShadow: `0 0 ${Math.floor(amp * 15)}px ${barColor}40`,
                        }}
                    />
                );
            })}
        </div>
    );
};
