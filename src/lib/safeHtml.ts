const allowedTags = new Set([
  "A",
  "ARTICLE",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "HR",
  "LI",
  "OL",
  "P",
  "SECTION",
  "SPAN",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);

/** Small preview-only allowlist. The iframe sandbox remains the second boundary. */
export function sanitizePreviewHtml(html: string) {
  if (typeof DOMParser === "undefined") return "";
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const node of [...document.body.querySelectorAll("*")]) {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      continue;
    }
    for (const attribute of [...node.attributes]) {
      const keepHref =
        node.tagName === "A" &&
        attribute.name === "href" &&
        /^https?:\/\//i.test(attribute.value);
      if (!keepHref) node.removeAttribute(attribute.name);
    }
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }
  }
  return document.body.innerHTML;
}

export function previewDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font:16px/1.65 Georgia,serif;color:#0b1739;max-width:760px;margin:0 auto;padding:40px 28px}h1,h2,h3{line-height:1.15}a{color:#1f55d9}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d9dfeb;padding:8px;text-align:left}</style></head><body>${sanitizePreviewHtml(html)}</body></html>`;
}
