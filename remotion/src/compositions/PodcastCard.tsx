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

export const PodcastCard: React.FC<ClipProps> = ({
    audioSrc,
    title,
    captionText,
    logoSrc,
    colors,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Card scale-in animation
    const cardScale = spring({ frame, fps, config: { damping: 15, mass: 0.8 } });
    const scale = interpolate(cardScale, [0, 1], [0.8, 1]);
    const opacity = interpolate(cardScale, [0, 1], [0, 1]);

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {/* Audio */}
            {audioSrc && <Audio src={audioSrc} />}

            {/* Background glow */}
            <div
                style={{
                    position: "absolute",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${colors.waveform}20, transparent 70%)`,
                    filter: "blur(60px)",
                }}
            />

            {/* Card */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 30,
                    padding: "60px 50px",
                    background: `linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))`,
                    borderRadius: 32,
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${colors.waveform}10`,
                    backdropFilter: "blur(20px)",
                    transform: `scale(${scale})`,
                    opacity,
                    maxWidth: 700,
                }}
            >
                {/* Profile Image */}
                {logoSrc ? (
                    <Img
                        src={logoSrc}
                        style={{
                            width: 140,
                            height: 140,
                            objectFit: "cover",
                            borderRadius: "50%",
                            border: `4px solid ${colors.waveform}60`,
                            boxShadow: `0 0 30px ${colors.waveform}20`,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${colors.waveform}50, ${colors.accent}50)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `4px solid ${colors.waveform}40`,
                        }}
                    >
                        <span style={{ fontSize: 60 }}>🎙️</span>
                    </div>
                )}

                {/* Speaker Name / Title */}
                <h1
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 38,
                        fontWeight: 800,
                        color: colors.text,
                        textAlign: "center",
                        margin: 0,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {title}
                </h1>

                {/* Mini label */}
                <div
                    style={{
                        padding: "6px 20px",
                        borderRadius: 20,
                        background: `${colors.waveform}20`,
                        border: `1px solid ${colors.waveform}30`,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                            color: colors.waveform,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                        }}
                    >
                        🔴 LIVE
                    </span>
                </div>

                {/* Waveform */}
                <Waveform
                    audioSrc={audioSrc}
                    barColor={colors.waveform}
                    barCount={28}
                    style="rounded"
                    width={550}
                    height={120}
                />
            </div>

            {/* Captions - below the card */}
            <div
                style={{
                    position: "absolute",
                    bottom: 80,
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <Captions
                    text={captionText}
                    textColor={colors.text}
                    fontSize={38}
                    maxWidth={900}
                />
            </div>
        </AbsoluteFill>
    );
};
