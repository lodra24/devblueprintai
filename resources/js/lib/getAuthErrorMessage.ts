import type { AxiosError } from "axios";

type ErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
    if (!error) {
        return "";
    }

    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError?.response?.data?.errors) {
        return Object.values(axiosError.response.data.errors).flat().join(" ");
    }

    if (axiosError?.response?.data?.message) {
        return axiosError.response.data.message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}
