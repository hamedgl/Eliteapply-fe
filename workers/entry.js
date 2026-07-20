const SHELL_PREFIXES = [
  "/app",
  "/admin",
  "/share",
  "/collaborator-invitations",
  "/referee",
  "/verify",
];

function needsShellFallback(pathname) {
  return SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!needsShellFallback(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;
    return env.ASSETS.fetch(new Request(new URL("/app/", url), request));
  },
};
