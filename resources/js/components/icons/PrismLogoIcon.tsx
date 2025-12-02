import React, { useId } from "react";
import type { IconProps } from "./IconProps";

export const PrismLogoIcon = ({
    className,
    width = 32,
    height = 32,
    ...props
}: IconProps) => {
    const gradientId = `${useId()}-prismBlueGradient`;

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="2"
                    y1="3"
                    x2="22"
                    y2="20"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
            </defs>
            <path
                d="M12 3L21 20H3L12 3Z"
                stroke={`url(#${gradientId})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.5 11.5L12 11.5L16.5 20"
                stroke={`url(#${gradientId})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
            />
        </svg>
    );
};
