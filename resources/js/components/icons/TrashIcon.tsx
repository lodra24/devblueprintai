import type { IconProps } from "./IconProps";

export const TrashIcon = ({
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
        <path d="M6 7h8l-.8 9.2a2 2 0 01-2 1.8H8.8a2 2 0 01-2-1.8L6 7zm7-3l-1-1H8L7 4H4v2h12V4h-3z" />
    </svg>
);
