import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";

/** Resolves and links to the single application a reference belongs to. */
export function ApplicationLink({ applicationId }: { applicationId: string }) {
  const query = useQuery({
    queryKey: queryKeys.application(applicationId),
    queryFn: ({ signal }) => applicationsApi.get(applicationId, signal),
  });
  if (query.isPending) return <span className="apps-row-subtitle apps-row-subtitle-loading" />;
  if (!query.data) return <span className="apps-row-subtitle">Application unavailable</span>;
  return (
    <Link to={`/app/applications/${applicationId}`} className="apps-inline-link">
      {query.data.title}
      {query.data.institution_name ? ` · ${query.data.institution_name}` : ""}
    </Link>
  );
}
