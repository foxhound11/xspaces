import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type CaptionsProps = {
    text: string;
    textColor: string;
    fontSize?: number;
    maxWidth?: number;
    wordsPerChunk?: number;
};

export const Captions: React.FC<CaptionsProps> = ({
    text,
    textColor,
    fontSize = 42,
    maxWidth = 900,
    wordsPerChunk = 5,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    if (!text || text.trim().length === 0) {
        return null;
    }

    // Split text into words, then group into chunks
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
    }

    if (chunks.length === 0) return null;

    // Evenly distribute chunks across the clip duration
    const framesPerChunk = Math.floor(durationInFrames / chunks.length);

    // Which chunk is currently active?
    const currentChunkIndex = Math.min(
        Math.floor(frame / framesPerChunk),
        chunks.length - 1
    );
    const currentChunk = chunks[currentChunkIndex];

    // Fade in/out animation for each chunk
    const chunkStartFrame = currentChunkIndex * framesPerChunk;
    const fadeDuration = Math.min(fps * 0.3, framesPerChunk * 0.15);

    const opacity = interpolate(
        frame,
        [
            chunkStartFrame,
            chunkStartFrame + fadeDuration,
            chunkStartFrame + framesPerChunk - fadeDuration,
            chunkStartFrame + framesPerChunk,
        ],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const translateY = interpolate(
        frame,
        [chunkStartFrame, chunkStartFrame + fadeDuration],
        [10, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                maxWidth: `${maxWidth}px`,
                padding: "16px 32px",
            }}
        >
            <p
                style={{
                    fontFamily:
                        "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: `${fontSize}px`,
                    fontWeight: 700,
                    color: textColor,
                    textAlign: "center",
                    lineHeight: 1.3,
                    opacity,
                    transform: `translateY(${translateY}px)`,
                    textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                    margin: 0,
                }}
            >
                {currentChunk}
            </p>
        </div>
    );
};
