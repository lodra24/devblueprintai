import { UseQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Project } from "@/types";
import { useProject } from "./useProject";

export const useBlueprintData = (
    projectId: string | undefined
): UseQueryResult<Project, AxiosError> => useProject(projectId);
