const SHELL_PREFIXES = ["/app", "/admin"];
const SHELL_EXACT = [
  "/login",
  "/register",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
];
const SHELL_WILDCARD_PREFIXES = [
  "/share",
  "/collaborator-invitations",
  "/referee",
  "/verify",
];

function isShellPath(pathname) {
  if (SHELL_EXACT.includes(pathname)) return true;
  return [...SHELL_PREFIXES, ...SHELL_WILDCARD_PREFIXES].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (isShellPath(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL("/app-shell.html", url), request));
    }
    return env.ASSETS.fetch(request);
  },
};
