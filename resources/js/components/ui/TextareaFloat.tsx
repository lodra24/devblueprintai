import React from "react";
import clsx from "clsx";

type Props = {
    id: string;
    label: string;
    rows?: number;
    className?: string;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};

export default function TextareaFloat({
    id,
    label,
    rows = 4,
    className,
    textareaProps,
}: Props) {
    const { className: textareaClassName, ...restTextareaProps } = textareaProps ?? {};

    return (
        <div className={clsx("float-wrap", className)}>
            <textarea
                id={id}
                rows={rows}
                placeholder=" "
                className={clsx("input-clean resize-none", textareaClassName)}
                {...restTextareaProps}
            />
            <label htmlFor={id} className="float-label">
                {label}
            </label>
        </div>
    );
}
