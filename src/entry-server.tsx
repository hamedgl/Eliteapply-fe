import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes, StaticRouter } from "react-router-dom";
import {
  LandingPage,
  ProductPreviewPage,
} from "./features/landing/LandingPage";
import {
  MarketingNotFoundPage,
  MarketingRoute,
} from "./features/marketing/MarketingPages";
import { getPageSeo, LAST_MODIFIED, PRERENDER_ROUTES } from "./seo/site";

const loading = (node: React.ReactNode) => (
  <Suspense
    fallback={
      <div className="page" role="status">
        Loading workspace…
      </div>
    }
  >
    {node}
  </Suspense>
);

function PublicApplication() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/product-preview" element={<ProductPreviewPage />} />
      <Route path="*" element={loading(<MarketingRoute />)} />
    </Routes>
  );
}

export function render(pathname: string, notFound = false) {
  const application = notFound ? (
    loading(<MarketingNotFoundPage />)
  ) : (
    <PublicApplication />
  );
  return renderToString(
    <StaticRouter location={pathname}>{application}</StaticRouter>,
  );
}

export { getPageSeo, LAST_MODIFIED, PRERENDER_ROUTES };
