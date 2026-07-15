import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const dist = path.join(process.cwd(), "dist");
const manifest = JSON.parse(
  await readFile(path.join(dist, ".seo-manifest.json"), "utf8"),
);
const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
const headers = await readFile(path.join(dist, "_headers"), "utf8");
const redirects = await readFile(path.join(dist, "_redirects"), "utf8");
const webManifest = JSON.parse(
  await readFile(path.join(dist, "site.webmanifest"), "utf8"),
);
const vercel = JSON.parse(
  await readFile(path.join(process.cwd(), "vercel.json"), "utf8"),
);

const count = (html, pattern) => html.match(pattern)?.length ?? 0;
const titles = new Set();
const descriptions = new Set();
const canonicals = new Set();

for (const page of manifest) {
  const html = await readFile(path.join(dist, page.file), "utf8");
  assert.match(
    html,
    /<div id="root">[\s\S]+<\/div>/,
    `${page.path}: empty root`,
  );
  assert.match(html, /<h1[ >]/, `${page.path}: missing prerendered H1`);
  assert.equal(count(html, /<title>/g), 1, `${page.path}: title count`);
  assert.equal(
    count(html, /rel="canonical"/g),
    1,
    `${page.path}: canonical count`,
  );
  assert.equal(
    count(html, /name="description"/g),
    1,
    `${page.path}: description count`,
  );
  assert.equal(count(html, /name="robots"/g), 1, `${page.path}: robots count`);
  assert.equal(
    count(html, /id="seo-structured-data"/g),
    1,
    `${page.path}: JSON-LD count`,
  );
  assert.ok(
    html.includes(`rel="canonical" href="${page.canonical}"`),
    `${page.path}: wrong canonical`,
  );
  const json = html.match(
    /<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(json, `${page.path}: structured data missing`);
  JSON.parse(json[1]);
  assert.equal(
    sitemap.includes(`<loc>${page.canonical}</loc>`),
    page.indexable,
    `${page.path}: sitemap policy mismatch`,
  );
  assert.equal(
    html.includes('content="noindex,nofollow,noarchive"'),
    !page.indexable,
    `${page.path}: robots policy mismatch`,
  );
  if (page.indexable) {
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/name="description" content="(.*?)"/)?.[1];
    assert.ok(title, `${page.path}: empty title`);
    assert.ok(description, `${page.path}: empty description`);
    assert.ok(!titles.has(title), `${page.path}: duplicate title`);
    assert.ok(
      !descriptions.has(description),
      `${page.path}: duplicate description`,
    );
    assert.ok(
      !canonicals.has(page.canonical),
      `${page.path}: duplicate canonical`,
    );
    titles.add(title);
    descriptions.add(description);
    canonicals.add(page.canonical);
  }
}

const shell = await readFile(path.join(dist, "app-shell.html"), "utf8");
assert.match(
  shell,
  /<div id="root"><\/div>/,
  "private app shell must be empty",
);
assert.match(
  shell,
  /noindex,nofollow,noarchive/,
  "private app shell must be noindex",
);

const notFound = await readFile(path.join(dist, "404.html"), "utf8");
assert.match(notFound, /<h1[ >]/, "404 must have a useful H1");
assert.match(notFound, /noindex,nofollow,noarchive/, "404 must be noindex");
assert.match(robots, /^User-agent: \*/m, "invalid robots.txt");
assert.match(robots, /Sitemap: https:\/\/eliteapply\.net\/sitemap\.xml/);
assert.match(robots, /Disallow: \/app\//, "private app routes must be blocked");
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.equal(
  count(sitemap, /<url>/g),
  manifest.filter((page) => page.indexable).length,
  "sitemap URL count",
);
for (const header of [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "X-Robots-Tag",
])
  assert.ok(headers.includes(header), `missing deployment header: ${header}`);
assert.match(redirects, /\/app\/\* \/app-shell\.html 200/);
for (const [index, line] of redirects.split(/\r?\n/).entries()) {
  const source = line.trim().split(/\s+/, 1)[0];
  if (source) {
    assert.ok(
      source.startsWith("/"),
      `_redirects line ${index + 1} must use a relative source path`,
    );
  }
}
assert.ok(vercel.headers?.length > 0, "vercel headers missing");
assert.ok(vercel.rewrites?.length > 0, "vercel private-route rewrites missing");
assert.equal(webManifest.name, "EliteApply");
assert.equal(webManifest.icons?.length, 2);
assert.ok((await stat(path.join(dist, "og-eliteapply.jpg"))).size > 10_000);
assert.match(
  await readFile(path.join(dist, "llms.txt"), "utf8"),
  /^# EliteApply/m,
  "llms.txt is missing or invalid",
);

console.log(`SEO checks passed for ${manifest.length} prerendered routes.`);
