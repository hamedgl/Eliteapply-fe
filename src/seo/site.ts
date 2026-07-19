import {
  featurePages,
  intentPages,
  resourceGuides,
} from "../features/marketing/marketingData";

export const SITE_URL = "https://eliteapply.net";
export const SOCIAL_IMAGE = `${SITE_URL}/og-eliteapply.jpg`;
export const LAST_MODIFIED = "2026-07-19";

type PageKind = "home" | "page" | "feature" | "article" | "utility";

type PageDefinition = {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  kind: PageKind;
};

export type PageSeo = PageDefinition & {
  canonical: string;
  fullTitle: string;
  robots: string;
  structuredData: Record<string, unknown>;
};

const corePages: readonly PageDefinition[] = [
  {
    path: "/",
    title: "EliteApply | Scholarship Application Workspace",
    description:
      "Organise scholarship applications, deadlines, evidence, documents and references in one calm workspace with EliteApply.",
    indexable: true,
    kind: "home",
  },
  {
    path: "/product-preview",
    title: "Interactive product preview",
    description:
      "Explore a realistic EliteApply workspace and see how applications, evidence, writing and references stay connected before signing up.",
    indexable: true,
    kind: "feature",
  },
  {
    path: "/features",
    title: "Scholarship application workspace features",
    description:
      "Explore EliteApply's application tracker, writing, document, reference and readiness workflows for students.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/how-it-works",
    title: "How EliteApply works",
    description:
      "See how EliteApply turns a scholarship opportunity into a clear plan, connected preparation workspace and final review.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/for-students",
    title: "EliteApply for scholarship applicants",
    description:
      "A flexible scholarship application workspace for undergraduate, master's, PhD, international and fellowship applicants.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/pricing",
    title: "EliteApply pricing",
    description:
      "Review current EliteApply access and any paid plans made available by the server-owned plan catalogue.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/security",
    title: "Security at EliteApply",
    description:
      "Review EliteApply's account, session, document, private-link, export and account-deletion security controls.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/about",
    title: "About EliteApply",
    description:
      "Why EliteApply is building a calm, student-controlled workspace for demanding scholarship applications.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/contact",
    title: "Contact EliteApply",
    description:
      "Contact EliteApply for product support, accessibility feedback, privacy questions or general enquiries.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/resources",
    title: "Scholarship application resources",
    description:
      "Practical, provider-led guidance for organising, writing and preparing scholarship applications.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Learn what personal information EliteApply handles, why it is used, when it may be shared and the controls available to users.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description:
      "Read the terms governing EliteApply accounts, application content, acceptable use, AI-assisted features and service limitations.",
    indexable: true,
    kind: "page",
  },
  {
    path: "/accessibility",
    title: "Accessibility statement",
    description:
      "Read EliteApply's WCAG 2.2 AA accessibility target, interface measures, known limitations and barrier-reporting process.",
    indexable: true,
    kind: "page",
  },
] as const;

const contentPages: readonly PageDefinition[] = [
  ...featurePages.map((page) => ({
    path: page.path,
    title: `${page.name} features`,
    description: page.description,
    indexable: true,
    kind: "feature" as const,
  })),
  ...intentPages.map((page) => ({
    path: page.path,
    title: page.name,
    description: page.description,
    indexable: true,
    kind: "feature" as const,
  })),
  ...resourceGuides.map((page) => ({
    path: page.path,
    title: page.title,
    description: page.description,
    indexable: true,
    kind: "article" as const,
  })),
];

const pages = [...corePages, ...contentPages];
const pageByPath = new Map(pages.map((page) => [page.path, page]));

export const PRERENDER_ROUTES = pages.map((page) => page.path);

const canonicalUrl = (path: string) =>
  path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;

const breadcrumbItems = (page: PageDefinition) => {
  const items: Array<{ name: string; url: string }> = [
    { name: "Home", url: `${SITE_URL}/` },
  ];
  if (page.path.startsWith("/features/"))
    items.push({ name: "Features", url: `${SITE_URL}/features` });
  if (page.path.startsWith("/resources/"))
    items.push({ name: "Resources", url: `${SITE_URL}/resources` });
  if (page.path !== "/")
    items.push({ name: page.title, url: canonicalUrl(page.path) });
  return items;
};

function structuredData(page: PageDefinition, canonical: string) {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "EliteApply",
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 1080,
      height: 1080,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@eliteapply.net",
    },
  };

  if (page.kind === "home") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organization,
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "EliteApply",
          url: `${SITE_URL}/`,
          publisher: { "@id": `${SITE_URL}/#organization` },
          inLanguage: "en",
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/#application`,
          name: "EliteApply",
          url: `${SITE_URL}/`,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          description: page.description,
          image: SOCIAL_IMAGE,
          publisher: { "@id": `${SITE_URL}/#organization` },
          featureList: [
            "Scholarship application tracking",
            "Deadline planning",
            "Evidence and document organisation",
            "Reference coordination",
            "Submission readiness review",
          ],
        },
      ],
    };
  }

  const graph: Record<string, unknown>[] = [
    organization,
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#application` },
      primaryImageOfPage: { "@id": `${canonical}#primaryimage` },
      inLanguage: "en",
    },
    {
      "@type": "ImageObject",
      "@id": `${canonical}#primaryimage`,
      url: SOCIAL_IMAGE,
      width: 1200,
      height: 630,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems(page).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  if (page.kind === "article") {
    graph.push({
      "@type": "Article",
      headline: page.title,
      description: page.description,
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      image: SOCIAL_IMAGE,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: LAST_MODIFIED,
      inLanguage: "en",
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function getPageSeo(pathname: string): PageSeo {
  const normalized = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  const page = pageByPath.get(normalized) ?? {
    path: normalized,
    title: "Page not found",
    description:
      "The requested EliteApply page could not be found. Explore the product features or scholarship application resources instead.",
    indexable: false,
    kind: "utility" as const,
  };
  const canonical = canonicalUrl(page.path);
  return {
    ...page,
    canonical,
    fullTitle:
      page.kind === "home"
        ? page.title
        : page.kind === "article"
          ? `${page.title} | Resources | EliteApply`
          : `${page.title} | EliteApply`,
    robots: page.indexable
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,nofollow,noarchive",
    structuredData: structuredData(page, canonical),
  };
}
