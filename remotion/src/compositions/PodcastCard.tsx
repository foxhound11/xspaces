import React from "react";
import {
    AbsoluteFill,
    Audio,
    Img,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import type { ClipProps } from "../Root";
import { Waveform } from "../components/Waveform";
import { SimpleEvenCaptions, TimestampedCaptions, KaraokeCaptions } from "../components/Captions";

export const PodcastCard: React.FC<ClipProps> = ({
    audioFile,
    title,
    captionText,
    captions,
    words,
    logoFile,
    colors,
    durationInSeconds,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const audioSrc = staticFile(audioFile);
    const logoSrc = logoFile ? staticFile(logoFile) : undefined;

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
            <Audio src={audioSrc} />

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
                        <span style={{ fontSize: 60, color: colors.text, opacity: 0.6, fontWeight: 800 }}>S2T</span>
                    </div>
                )}

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
                        LIVE
                    </span>
                </div>

                <Waveform
                    audioSrc={audioSrc}
                    barColor={colors.waveform}
                    barCount={28}
                    style="rounded"
                    width={550}
                    height={120}
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
                        fontSize={40}
                        maxWidth={900}
                    />
                ) : captions && captions.length > 0 ? (
                    <TimestampedCaptions
                        captions={captions}
                        textColor={colors.text}
                        fontSize={38}
                        maxWidth={900}
                    />
                ) : (
                    <SimpleEvenCaptions
                        text={captionText}
                        durationInSeconds={durationInSeconds}
                        textColor={colors.text}
                        fontSize={38}
                        maxWidth={900}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};
