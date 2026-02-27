import React from "react";
import {
    AbsoluteFill,
    Audio,
    Img,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import type { ClipProps } from "../Root";
import { Waveform } from "../components/Waveform";
import { Captions } from "../components/Captions";

export const SplitScreen: React.FC<ClipProps> = ({
    audioSrc,
    title,
    captionText,
    logoSrc,
    colors,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Left panel slide-in
    const leftSlide = spring({ frame, fps, config: { damping: 18 } });
    const leftX = interpolate(leftSlide, [0, 1], [-540, 0]);

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
            }}
        >
            {/* Audio */}
            {audioSrc && <Audio src={audioSrc} />}

            {/* Left Panel - Image / Logo */}
            <div
                style={{
                    width: "50%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `translateX(${leftX}px)`,
                    background: `linear-gradient(135deg, ${colors.accent}20, ${colors.waveform}10)`,
                    borderRight: `2px solid ${colors.waveform}30`,
                }}
            >
                {logoSrc ? (
                    <Img
                        src={logoSrc}
                        style={{
                            width: 350,
                            height: 350,
                            objectFit: "cover",
                            borderRadius: "50%",
                            border: `4px solid ${colors.waveform}60`,
                            boxShadow: `0 0 60px ${colors.waveform}30`,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 350,
                            height: 350,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${colors.waveform}40, ${colors.accent}40)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `4px solid ${colors.waveform}40`,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 120,
                                color: colors.text,
                                opacity: 0.5,
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 800,
                            }}
                        >
                            🎙️
                        </span>
                    </div>
                )}
            </div>

            {/* Right Panel - Waveform + Captions */}
            <div
                style={{
                    width: "50%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 40,
                    padding: 40,
                }}
            >
                {/* Title */}
                <h1
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 36,
                        fontWeight: 800,
                        color: colors.text,
                        textAlign: "center",
                        letterSpacing: "-0.02em",
                        margin: 0,
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </h1>

                {/* Waveform */}
                <Waveform
                    audioSrc={audioSrc}
                    barColor={colors.waveform}
                    barCount={24}
                    style="rounded"
                    width={420}
                    height={180}
                />

                {/* Captions */}
                <Captions
                    text={captionText}
                    textColor={colors.text}
                    fontSize={32}
                    maxWidth={450}
                    wordsPerChunk={4}
                />
            </div>
        </AbsoluteFill>
    );
};
