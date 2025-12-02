import type { IconProps } from "./IconProps";

export const SearchSolidIcon = ({
    className,
    width = 18,
    height = 18,
    ...props
}: IconProps) => (
    <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        {...props}
    >
        <path
            fillRule="evenodd"
            d="M12.9 14.32a7 7 0 111.414-1.414l3.39 3.39a1 1 0 01-1.415 1.414l-3.39-3.39zM14 9a5 5 0 11-10 0 5 5 0 0110 0z"
            clipRule="evenodd"
        />
    </svg>
);
