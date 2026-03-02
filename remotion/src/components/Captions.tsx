/**
 * Caption Abstraction Layer
 * =========================
 *
 * 1. KaraokeCaptions   — TikTok/CapCut style: shows a window of words,
 *                        highlights the currently spoken word in a bright colour.
 *                        Requires word-level timestamps from Gemini (`words` prop).
 *                        THIS IS THE DEFAULT.
 *
 * 2. SimpleEvenCaptions — fallback when no timestamps are available.
 *
 * 3. TimestampedCaptions — phrase-level (kept for compatibility / future use).
 *
 * HOW TO SWITCH:
 *   KaraokeCaptions is used automatically when `words` is passed in ClipProps.
 *   Falls back to SimpleEvenCaptions when words array is absent.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// ─── Shared types ──────────────────────────────────────────────────────────

export type TimedWord = {
    text: string;
    start: number; // seconds
    end: number;   // seconds
};

export type TimedCaption = {
    text: string;
    start: number;
    end: number;
};

type SharedStyle = {
    textColor?: string;
    highlightColor?: string; // defaults to #00ff88 (green)
    fontSize?: number;
    maxWidth?: number;
};

// ─── 1. Karaoke (TikTok-style) captions ────────────────────────────────────

type KaraokeCaptionsProps = SharedStyle & {
    words: TimedWord[];
};

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
    words,
    textColor = "#ffffff",
    highlightColor = "#00ff88",
    fontSize = 52,
    maxWidth = 900,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (!words || words.length === 0) return null;

    const currentTime = frame / fps;

    // Find which word is currently being spoken
    const currentIdx = words.findIndex(
        (w) => currentTime >= w.start && currentTime <= w.end
    );

    // If between words, find the next upcoming word
    const activeIdx =
        currentIdx >= 0
            ? currentIdx
            : words.findIndex((w) => w.start > currentTime) - 1;

    const displayIdx = Math.max(0, activeIdx < 0 ? words.length - 1 : activeIdx);

    // Show a window of words centred around the current word
    const WINDOW = 6; // words visible at once
    const windowStart = Math.max(0, displayIdx - 2);
    const windowEnd = Math.min(words.length, windowStart + WINDOW);
    const visibleWords = words.slice(windowStart, windowEnd);

    // Fade the whole block in at start, out before silence gaps
    const blockStartFrame = words[windowStart].start * fps;
    const blockEndFrame = words[Math.min(windowEnd - 1, words.length - 1)].end * fps;
    const fadeDur = fps * 0.12;
    const opacity = interpolate(
        frame,
        [blockStartFrame, blockStartFrame + fadeDur, blockEndFrame - fadeDur, blockEndFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@1,900&display=swap');`}
            </style>
            <div
                style={{
                    maxWidth: `${maxWidth}px`,
                    opacity,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    alignContent: "center",
                    gap: "14px",
                    padding: "20px 40px",
                }}
            >
                {visibleWords.map((word, i) => {
                    const globalIdx = windowStart + i;
                    const isActive = globalIdx === displayIdx && currentIdx >= 0;

                    const baseColor = isActive ? highlightColor : textColor;
                    const targetSize = fontSize * 1.8; // Massively bump the size up

                    return (
                        <span
                            key={globalIdx}
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: `${targetSize}px`,
                                fontWeight: 900,
                                fontStyle: "italic",
                                textTransform: "uppercase",
                                color: baseColor,
                                WebkitTextStroke: `${Math.max(6, targetSize * 0.1)}px black`,
                                WebkitTextFillColor: baseColor,
                                paintOrder: "stroke fill",
                                textShadow: `
                                    0px 10px 24px rgba(0,0,0,0.9),
                                    0px 0px 30px ${isActive ? highlightColor + "90" : "transparent"}
                                `,
                                letterSpacing: "-0.04em",
                                lineHeight: 1.15,
                                // Pop and slightly rotate the active word for energy
                                transform: isActive ? "scale(1.15) rotate(-3deg)" : "scale(1) rotate(0deg)",
                                transformOrigin: "center center",
                                transition: "all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                display: "inline-block",
                                padding: "4px 8px", // Padding prevents clipping the heavy shadows
                            }}
                        >
                            {word.text}
                        </span>
                    );
                })}
            </div>
        </>
    );
};

// ─── 2. Simple evenly-distributed captions (fallback) ─────────────────────

type SimpleEvenCaptionsProps = SharedStyle & {
    text: string;
    durationInSeconds: number;
    wordsPerChunk?: number;
};

export const SimpleEvenCaptions: React.FC<SimpleEvenCaptionsProps> = ({
    text,
    durationInSeconds,
    textColor = "#ffffff",
    fontSize = 42,
    maxWidth = 900,
    wordsPerChunk = 6,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (!text || text.trim().length === 0) return null;

    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    if (chunks.length === 0) return null;

    const totalFrames = Math.ceil(durationInSeconds * fps);
    const framesPerChunk = Math.max(1, Math.floor(totalFrames / chunks.length));
    const currentChunkIndex = Math.min(Math.floor(frame / framesPerChunk), chunks.length - 1);
    const currentChunk = chunks[currentChunkIndex];
    const chunkStartFrame = currentChunkIndex * framesPerChunk;
    const fadeDuration = Math.min(fps * 0.2, framesPerChunk * 0.15, 8);

    const opacity = interpolate(
        frame,
        [chunkStartFrame, chunkStartFrame + fadeDuration, chunkStartFrame + framesPerChunk - fadeDuration, chunkStartFrame + framesPerChunk],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const translateY = interpolate(frame, [chunkStartFrame, chunkStartFrame + fadeDuration], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
        <CaptionBubble text={currentChunk} textColor={textColor} fontSize={fontSize} maxWidth={maxWidth} opacity={opacity} translateY={translateY} />
    );
};

// ─── 3. Phrase-level timestamped captions ─────────────────────────────────

type TimestampedCaptionsProps = SharedStyle & {
    captions: TimedCaption[];
};

export const TimestampedCaptions: React.FC<TimestampedCaptionsProps> = ({
    captions,
    textColor = "#ffffff",
    fontSize = 42,
    maxWidth = 900,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeSecs = frame / fps;
    const active = captions.find((c) => currentTimeSecs >= c.start && currentTimeSecs < c.end);
    if (!active) return null;

    const startFrame = active.start * fps;
    const endFrame = active.end * fps;
    const fadeDuration = Math.min(fps * 0.15, (endFrame - startFrame) * 0.2, 6);
    const opacity = interpolate(frame, [startFrame, startFrame + fadeDuration, endFrame - fadeDuration, endFrame], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const translateY = interpolate(frame, [startFrame, startFrame + fadeDuration], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return <CaptionBubble text={active.text} textColor={textColor} fontSize={fontSize} maxWidth={maxWidth} opacity={opacity} translateY={translateY} />;
};

// ─── Shared pill bubble ────────────────────────────────────────────────────

const CaptionBubble: React.FC<{
    text: string; textColor: string; fontSize: number;
    maxWidth: number; opacity: number; translateY: number;
}> = ({ text, textColor, fontSize, maxWidth, opacity, translateY }) => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", maxWidth: `${maxWidth}px`, opacity, transform: `translateY(${translateY}px)` }}>
        <div style={{ backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 14, padding: "14px 28px", backdropFilter: "blur(4px)" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: `${fontSize}px`, fontWeight: 700, color: textColor, textAlign: "center", lineHeight: 1.25, textShadow: "0 1px 8px rgba(0,0,0,0.6)", margin: 0 }}>
                {text}
            </p>
        </div>
    </div>
);
