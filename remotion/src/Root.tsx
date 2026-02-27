import { Composition } from "remotion";
import { CenteredWaveform } from "./compositions/CenteredWaveform";
import { SplitScreen } from "./compositions/SplitScreen";
import { PodcastCard } from "./compositions/PodcastCard";

export type ClipProps = {
    audioSrc: string;
    title: string;
    captionText: string;
    logoSrc?: string;
    logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    colors: {
        background: string;
        waveform: string;
        text: string;
        accent: string;
    };
    durationInSeconds: number;
};

const FPS = 30;

export const RemotionRoot: React.FC = () => {
    const defaultProps: ClipProps = {
        audioSrc: "",
        title: "Space2Thread",
        captionText: "",
        logoSrc: undefined,
        logoPosition: "top-right",
        colors: {
            background: "#0a0a0a",
            waveform: "#a855f7",
            text: "#ffffff",
            accent: "#3b82f6",
        },
        durationInSeconds: 60,
    };

    return (
        <>
            <Composition
                id="CenteredWaveform"
                component={CenteredWaveform}
                durationInFrames={FPS * 60}
                fps={FPS}
                width={1080}
                height={1080}
                defaultProps={defaultProps}
                calculateMetadata={({ props }) => ({
                    durationInFrames: Math.ceil(props.durationInSeconds * FPS),
                })}
            />
            <Composition
                id="SplitScreen"
                component={SplitScreen}
                durationInFrames={FPS * 60}
                fps={FPS}
                width={1080}
                height={1080}
                defaultProps={defaultProps}
                calculateMetadata={({ props }) => ({
                    durationInFrames: Math.ceil(props.durationInSeconds * FPS),
                })}
            />
            <Composition
                id="PodcastCard"
                component={PodcastCard}
                durationInFrames={FPS * 60}
                fps={FPS}
                width={1080}
                height={1080}
                defaultProps={defaultProps}
                calculateMetadata={({ props }) => ({
                    durationInFrames: Math.ceil(props.durationInSeconds * FPS),
                })}
            />
        </>
    );
};
