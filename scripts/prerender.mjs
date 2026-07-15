import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const serverEntry = path.join(root, ".prerender", "entry-server.js");
const { getPageSeo, LAST_MODIFIED, PRERENDER_ROUTES, render } = await import(
  `${pathToFileURL(serverEntry).href}?t=${Date.now()}`
);
const template = await readFile(path.join(dist, "index.html"), "utf8");
const redirectFile = path.join(dist, "_redirects");
const baseRedirects = await readFile(redirectFile, "utf8").catch(() => "");
const socialImage = "https://eliteapply.net/og-eliteapply.jpg";

const escapeAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const safeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

function seoHead(seo) {
  const type = seo.kind === "article" ? "article" : "website";
  return `<!--seo:start-->
    <title>${escapeAttribute(seo.fullTitle)}</title>
    <meta name="robots" content="${escapeAttribute(seo.robots)}" />
    <meta name="description" content="${escapeAttribute(seo.description)}" />
    <link rel="canonical" href="${escapeAttribute(seo.canonical)}" />
    <link rel="alternate" hreflang="en" href="${escapeAttribute(seo.canonical)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="EliteApply" />
    <meta property="og:locale" content="en_GB" />
    <meta property="og:url" content="${escapeAttribute(seo.canonical)}" />
    <meta property="og:title" content="${escapeAttribute(seo.fullTitle)}" />
    <meta property="og:description" content="${escapeAttribute(seo.description)}" />
    <meta property="og:image" content="${socialImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="EliteApply scholarship application workspace" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(seo.fullTitle)}" />
    <meta name="twitter:description" content="${escapeAttribute(seo.description)}" />
    <meta name="twitter:image" content="${socialImage}" />
    <meta name="twitter:image:alt" content="EliteApply scholarship application workspace" />
    <script id="seo-structured-data" type="application/ld+json">${safeJson(seo.structuredData)}</script>
    <!--seo:end-->`;
}

function pageHtml(seo, rootHtml = "") {
  return template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, seoHead(seo))
    .replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`);
}

function routeFile(pathname) {
  return pathname === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, pathname.slice(1), "index.html");
}

const manifest = [];
const publicRedirects = [];
for (const pathname of PRERENDER_ROUTES) {
  const seo = getPageSeo(pathname);
  const file = routeFile(pathname);
  const html = pageHtml(seo, render(pathname));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, "utf8");
  if (pathname !== "/") {
    const flatFile = path.join(dist, `${pathname.slice(1)}.html`);
    await mkdir(path.dirname(flatFile), { recursive: true });
    await writeFile(flatFile, html, "utf8");
    publicRedirects.push(`${pathname} /${pathname.slice(1)}.html 200`);
  }
  manifest.push({
    path: pathname,
    file: path.relative(dist, file),
    canonical: seo.canonical,
    indexable: seo.indexable,
  });
}

const shellRoutes = [
  "/login",
  "/register",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
  "/app",
];
const shell = pageHtml(getPageSeo("/app"));
await writeFile(path.join(dist, "app-shell.html"), shell, "utf8");
for (const pathname of shellRoutes) {
  const file = routeFile(pathname);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, shell, "utf8");
}

await writeFile(
  path.join(dist, "404.html"),
  pageHtml(getPageSeo("/404"), render("/404", true)),
  "utf8",
);

const indexable = manifest.filter((page) => page.indexable);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map(
    (page) =>
      `  <url><loc>${page.canonical}</loc><lastmod>${LAST_MODIFIED}</lastmod></url>`,
  )
  .join("\n")}
</urlset>
`;
await writeFile(path.join(dist, "sitemap.xml"), sitemap, "utf8");
await writeFile(
  path.join(dist, ".seo-manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);
await writeFile(
  redirectFile,
  `${baseRedirects.trim()}\n\n${publicRedirects.join("\n")}\n`,
  "utf8",
);
await rm(path.join(root, ".prerender"), { recursive: true, force: true });

console.log(
  `Prerendered ${manifest.length} public routes (${indexable.length} indexable).`,
);
