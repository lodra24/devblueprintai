import React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean };

export default function ButtonEditorial({
    full = true,
    className,
    children,
    ...rest
}: Props) {
    return (
        <button className={clsx("btn-editorial", full && "w-full", className)} {...rest}>
            {children}
        </button>
    );
}
