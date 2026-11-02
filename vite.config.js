import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The app talks to the backend through a same-origin "/api" path. In dev, Vite
// proxies it (below); in the Docker image, nginx does the same job. Because the
// browser only ever sees same-origin requests, the backend's CORS_ORIGIN setting
// stops mattering and Render cold-starts don't trip CORS preflights.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = (env.BACKEND_ORIGIN || "https://curaflow-backend-pfrn.onrender.com").replace(/\/+$/, "");

  const proxy = {
    "/api": {
      target: backend,
      changeOrigin: true,
      secure: true,
      // Render's free tier can take ~30-60s to wake up on the first request.
      timeout: 120000,
      proxyTimeout: 120000,
    },
  };

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      strictPort: true, // fail loudly instead of silently moving to a random port
      proxy,
      watch: { usePolling: env.VITE_USE_POLLING === "true" },
    },
    preview: { host: true, port: 3000, strictPort: true, proxy },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.js"],
      css: false,
    },
  };
});
