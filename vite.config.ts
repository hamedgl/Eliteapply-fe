import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? "https://api.eliteapply.net";

// The auth session + CSRF cookies are SameSite=Lax, so a browser on localhost never
// sends them to api.eliteapply.net (cross-site) and every reload lost the session.
// Proxying keeps the API same-origin in dev, exactly like production.
const apiProxy: Record<string, ProxyOptions> = {
  "/api/avatar": {
    target: "https://eliteapply.net",
    changeOrigin: true,
  },
  "/api": {
    target: API_TARGET,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        // CSRFAndOriginMiddleware only allows FRONTEND_URL, so a forwarded
        // "Origin: http://localhost:5173" gets 403 origin_not_allowed. It skips the
        // check when the header is absent; the CSRF double-submit token still applies,
        // and this rewrite exists only in the dev/preview server.
        proxyReq.removeHeader("origin");
      });
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
