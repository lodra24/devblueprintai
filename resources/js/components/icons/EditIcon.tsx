import type { IconProps } from "./IconProps";

export const EditIcon = ({
    className,
    width = 20,
    height = 20,
    ...props
}: IconProps) => (
    <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        width={width}
        height={height}
        className={className}
        {...props}
    >
        <path d="M4 13.5V16h2.5L15.81 6.69l-2.5-2.5L4 13.5zm12.71-7.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-1.29 1.29 2.5 2.5 1.29-1.29z" />
    </svg>
);
