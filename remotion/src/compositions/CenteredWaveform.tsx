import React from "react";
import {
    AbsoluteFill,
    Audio,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import type { ClipProps } from "../Root";
import { Waveform } from "../components/Waveform";
import { Captions } from "../components/Captions";
import { Logo } from "../components/Logo";

export const CenteredWaveform: React.FC<ClipProps> = ({
    audioSrc,
    title,
    captionText,
    logoSrc,
    logoPosition = "top-right",
    colors,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title animation - slides in from top
    const titleProgress = spring({ frame, fps, config: { damping: 20 } });
    const titleY = interpolate(titleProgress, [0, 1], [-50, 0]);
    const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

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

            {/* Subtle radial gradient background */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 50% 40%, ${colors.waveform}15, transparent 70%)`,
                }}
            />

            {/* Logo */}
            {logoSrc && <Logo src={logoSrc} position={logoPosition} size={90} />}

            {/* Title */}
            <div
                style={{
                    position: "absolute",
                    top: 80,
                    transform: `translateY(${titleY}px)`,
                    opacity: titleOpacity,
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 48,
                        fontWeight: 800,
                        color: colors.text,
                        textAlign: "center",
                        letterSpacing: "-0.02em",
                        margin: 0,
                        textShadow: "0 2px 30px rgba(0,0,0,0.5)",
                    }}
                >
                    {title}
                </h1>
            </div>

            {/* Waveform - center */}
            <div style={{ marginTop: 40 }}>
                <Waveform
                    audioSrc={audioSrc}
                    barColor={colors.waveform}
                    barCount={40}
                    style="rounded"
                    width={900}
                    height={250}
                />
            </div>

            {/* Captions - bottom */}
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
                    fontSize={40}
                    maxWidth={900}
                />
            </div>
        </AbsoluteFill>
    );
};
