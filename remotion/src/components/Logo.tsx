import React from "react";
import { Img } from "remotion";

type LogoProps = {
    src: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size?: number;
    padding?: number;
    opacity?: number;
    rounded?: boolean;
};

export const Logo: React.FC<LogoProps> = ({
    src,
    position = "top-right",
    size = 80,
    padding = 40,
    opacity = 1,
    rounded = true,
}) => {
    if (!src) return null;

    const positionStyles: React.CSSProperties = {};

    if (position.includes("top")) positionStyles.top = `${padding}px`;
    if (position.includes("bottom")) positionStyles.bottom = `${padding}px`;
    if (position.includes("left")) positionStyles.left = `${padding}px`;
    if (position.includes("right")) positionStyles.right = `${padding}px`;

    return (
        <div
            style={{
                position: "absolute",
                ...positionStyles,
                zIndex: 10,
            }}
        >
            <Img
                src={src}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    objectFit: "cover",
                    borderRadius: rounded ? "50%" : "12px",
                    opacity,
                    border: "3px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
            />
        </div>
    );
};
