import type { IconProps } from "./IconProps";

export const CopyIcon = ({
    className,
    width = 14,
    height = 14,
    ...props
}: IconProps) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        className={className}
        {...props}
    >
        <path
            d="M8 8H16V16H8V8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 4H6C4.89543 4 4 4.89543 4 6V16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
