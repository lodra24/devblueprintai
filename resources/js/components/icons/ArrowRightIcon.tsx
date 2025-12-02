import type { IconProps } from "./IconProps";

export const ArrowRightIcon = ({
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
        <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.64L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.16-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
        />
    </svg>
);
