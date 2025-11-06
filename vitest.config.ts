import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import viteConfig from "./vite.config.js";

export default mergeConfig(
    viteConfig,
    defineConfig({
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "resources/js"),
            },
        },
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: ["./tests/setupTests.ts"],
            include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
            pool: "forks",
            poolOptions: {
                forks: {
                    singleFork: true,
                },
            },
        },
    })
);
