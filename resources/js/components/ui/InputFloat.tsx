import React from "react";
import clsx from "clsx";

type Props = {
    id: string;
    label: string;
    className?: string;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

export default function InputFloat({ id, label, className, inputProps }: Props) {
    return (
        <div className={clsx("float-wrap", className)}>
            <input id={id} placeholder=" " className="input-clean" {...inputProps} />
            <label htmlFor={id} className="float-label">
                {label}
            </label>
        </div>
    );
}
