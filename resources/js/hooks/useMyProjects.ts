import {
    keepPreviousData,
    useQuery,
    UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getMyProjects } from "@/api";
import { qk } from "@/lib/queryKeys";
import { Paginated, ProjectSummary } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export const MY_PROJECTS_DEFAULT_PER_PAGE = 10;

interface UseMyProjectsOptions {
    page: number;
    perPage?: number;
}

export const useMyProjects = ({
    page,
    perPage = MY_PROJECTS_DEFAULT_PER_PAGE,
}: UseMyProjectsOptions): UseQueryResult<
    Paginated<ProjectSummary[]>,
    AxiosError
> => {
    const { user } = useAuth();

    return useQuery<Paginated<ProjectSummary[]>, AxiosError>({
        queryKey: qk.myProjects(page, perPage),
        queryFn: () => getMyProjects({ page, perPage }),
        enabled: !!user,
        staleTime: 60 * 1000, // 60 seconds
        placeholderData: keepPreviousData,
        retry: (failureCount, error) => {
            if (error.response?.status === 401) {
                return false;
            }

            return failureCount < 2;
        },
    });
};
