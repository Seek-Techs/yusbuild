/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vite configuration.
 *
 * Two things here are load-bearing and easy to undo by accident:
 *
 * 1. The `/api` dev proxy. `.env.example` documents `VITE_API_URL=/api`, which
 *    only works because this proxy forwards to the Django dev server. Without
 *    it every API request 404s against Vite itself.
 *
 * 2. The `_prototype` alias. In production the prototype module is redirected
 *    to an empty stub so the reference screens and their fixture data are
 *    dropped from the bundle. An `import.meta.env.DEV` guard alone is not
 *    enough — the bundler still emits the chunk because it cannot prove the
 *    branch is dead.
 */
export default defineConfig(({ command, mode }) => {
  const isProductionBuild = command === "build" && mode !== "development";

  return {
    plugins: [react()],
    resolve: {
      alias: [
        ...(isProductionBuild
          ? [
              {
                find: /^@\/_prototype\/routes$/,
                replacement: path.resolve(
                  __dirname,
                  "./src/_prototype/routes.stub.tsx",
                ),
              },
            ]
          : []),
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },
    server: {
      proxy: {
        "/api": {
          target: process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: [
          "src/components/shared/**",
          "src/components/charts/**",
          "src/layouts/**",
          "src/lib/**",
          "src/hooks/**",
          "src/stores/**",
        ],
        exclude: ["**/*.test.{ts,tsx}", "**/index.ts"],
      },
      exclude: ["node_modules/**", "dist/**", "src/_prototype/**"],
    },
  };
});
