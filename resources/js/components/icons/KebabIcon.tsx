import type { IconProps } from "./IconProps";

export const KebabIcon = ({
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
        <circle cx="10" cy="3.5" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="16.5" r="1.5" />
    </svg>
);
