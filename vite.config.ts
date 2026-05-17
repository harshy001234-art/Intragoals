// @lovable.dev/vite-tanstack-config already includes the following ; do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/app/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this ; wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    preview: {
      allowedHosts: ["alluring-grace-production-79b0.up.railway.app"],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api/, "/api"),
        },
      },
    },
  },
  tanstackStart: {
    start: {
      entry: "app/start",
    },
    router: {
      entry: "app/router",
      routesDirectory: "app/routes",
      generatedRouteTree: "app/routeTree.gen.ts",
    },
    server: { entry: "app/server" },
  },
});
