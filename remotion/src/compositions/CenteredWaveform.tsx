import React from "react";
import {
    AbsoluteFill,
    Audio,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import type { ClipProps } from "../Root";
import { Waveform } from "../components/Waveform";
import { SimpleEvenCaptions, TimestampedCaptions, KaraokeCaptions } from "../components/Captions";
import { Logo } from "../components/Logo";

export const CenteredWaveform: React.FC<ClipProps> = ({
    audioFile,
    title,
    captionText,
    captions,
    words,
    logoFile,
    logoPosition = "top-right",
    colors,
    durationInSeconds,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const audioSrc = staticFile(audioFile);
    const logoSrc = logoFile ? staticFile(logoFile) : undefined;

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
            <Audio src={audioSrc} />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 50% 40%, ${colors.waveform}15, transparent 70%)`,
                }}
            />

            {logoSrc && <Logo src={logoSrc} position={logoPosition} size={90} />}

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

            <div
                style={{
                    position: "absolute",
                    bottom: 80,
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                {words && words.length > 0 ? (
                    <KaraokeCaptions
                        words={words}
                        textColor={colors.text}
                        highlightColor={colors.waveform}
                        fontSize={42}
                        maxWidth={900}
                    />
                ) : captions && captions.length > 0 ? (
                    <TimestampedCaptions
                        captions={captions}
                        textColor={colors.text}
                        fontSize={40}
                        maxWidth={900}
                    />
                ) : (
                    <SimpleEvenCaptions
                        text={captionText}
                        durationInSeconds={durationInSeconds}
                        textColor={colors.text}
                        fontSize={40}
                        maxWidth={900}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};
