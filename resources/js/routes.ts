export const routePaths = {
    home: "/",
    login: "/login",
    register: "/register",
    dashboard: "/dashboard",
    blueprint: "/blueprint/:projectId",
} as const;

export const routeUrls = {
    home: routePaths.home,
    login: routePaths.login,
    register: routePaths.register,
    dashboard: routePaths.dashboard,
    blueprint: (projectId: string) => `/blueprint/${projectId}`,
} as const;
