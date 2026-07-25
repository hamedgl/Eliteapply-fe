import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? "https://api.eliteapply.net";

// The auth session + CSRF cookies are SameSite=Lax, so a browser on localhost never
// sends them to api.eliteapply.net (cross-site) and every reload lost the session.
// Proxying keeps the API same-origin in dev, exactly like production.
const apiProxy: Record<string, ProxyOptions> = {
  "/api": {
    target: API_TARGET,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyRes", (proxyRes) => {
        const cookies = proxyRes.headers["set-cookie"];
        if (Array.isArray(cookies)) {
          // Secure cookies over http://localhost are rejected outside Chrome.
          proxyRes.headers["set-cookie"] = cookies.map((c) =>
            c.replace(/;\s*Secure/gi, ""),
          );
        }
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { port: 5173, proxy: apiProxy },
  preview: { proxy: apiProxy },
});
