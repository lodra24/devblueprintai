import type { IconProps } from "./IconProps";

export const CloseIcon = ({
    className,
    width = 10,
    height = 10,
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
            d="M7 7L17 17M7 17L17 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
