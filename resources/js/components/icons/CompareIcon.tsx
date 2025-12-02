import type { IconProps } from "./IconProps";

export const CompareIcon = ({
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
            d="M12 6H20M12 12H20M12 18H20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 6H6V18H4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
