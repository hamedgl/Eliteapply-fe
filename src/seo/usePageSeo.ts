import { useEffect } from "react";

const setMeta = (
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const setLink = (selector: string, rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
  return element;
};

export function usePageSeo(pathname: string) {
  useEffect(() => {
    let active = true;
    void import("./site").then(({ getPageSeo, SOCIAL_IMAGE }) => {
      if (!active) return;
      const seo = getPageSeo(pathname);
      document.title = seo.fullTitle;
      setMeta(
        'meta[name="description"]',
        "name",
        "description",
        seo.description,
      );
      setMeta('meta[name="robots"]', "name", "robots", seo.robots);
      setMeta(
        'meta[property="og:type"]',
        "property",
        "og:type",
        seo.kind === "article" ? "article" : "website",
      );
      setMeta(
        'meta[property="og:title"]',
        "property",
        "og:title",
        seo.fullTitle,
      );
      setMeta(
        'meta[property="og:description"]',
        "property",
        "og:description",
        seo.description,
      );
      setMeta('meta[property="og:url"]', "property", "og:url", seo.canonical);
      setMeta(
        'meta[property="og:image"]',
        "property",
        "og:image",
        SOCIAL_IMAGE,
      );
      setMeta(
        'meta[property="og:image:width"]',
        "property",
        "og:image:width",
        "1200",
      );
      setMeta(
        'meta[property="og:image:height"]',
        "property",
        "og:image:height",
        "630",
      );
      setMeta(
        'meta[property="og:image:alt"]',
        "property",
        "og:image:alt",
        "EliteApply scholarship application workspace",
      );
      setMeta(
        'meta[property="og:site_name"]',
        "property",
        "og:site_name",
        "EliteApply",
      );
      setMeta('meta[property="og:locale"]', "property", "og:locale", "en_GB");
      setMeta(
        'meta[name="twitter:card"]',
        "name",
        "twitter:card",
        "summary_large_image",
      );
      setMeta(
        'meta[name="twitter:title"]',
        "name",
        "twitter:title",
        seo.fullTitle,
      );
      setMeta(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        seo.description,
      );
      setMeta(
        'meta[name="twitter:image"]',
        "name",
        "twitter:image",
        SOCIAL_IMAGE,
      );
      setMeta(
        'meta[name="twitter:image:alt"]',
        "name",
        "twitter:image:alt",
        "EliteApply scholarship application workspace",
      );
      setLink('link[rel="canonical"]', "canonical", seo.canonical);
      const alternate = setLink(
        'link[rel="alternate"][hreflang="en"]',
        "alternate",
        seo.canonical,
      );
      alternate.hreflang = "en";

      let script = document.head.querySelector<HTMLScriptElement>(
        "#seo-structured-data",
      );
      if (!script) {
        script = document.createElement("script");
        script.id = "seo-structured-data";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(seo.structuredData).replaceAll(
        "<",
        "\\u003c",
      );
    });
    return () => {
      active = false;
    };
  }, [pathname]);
}
