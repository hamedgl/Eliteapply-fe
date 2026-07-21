import { Link } from "react-router-dom";
import { Lock, ShieldCheck, Flag, BookOpen } from "lucide-react";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { countryName } from "../../../lib/countries";
import { formatDate } from "../../applications/model";
import { itemMeta, kindSingular, title, type CatalogueItem, type Kind } from "../model";

export function CatalogueCard({
  kind,
  item,
  onReportIssue,
}: {
  kind: Kind;
  item: CatalogueItem;
  onReportIssue?: (item: CatalogueItem) => void;
}) {
  const meta = itemMeta(item);
  const verified = item.visibility === "canonical";
  const programmeCount = meta.programme_count;

  const subtitle = [
    meta.country_code ? countryName(meta.country_code) : null,
    kind === "institutions" && meta.institution_type ? title(meta.institution_type) : null,
    meta.provider_name,
    meta.degree_level ? title(meta.degree_level) : null,
    meta.field_of_study,
    meta.duration,
    meta.delivery_mode ? title(meta.delivery_mode) : null,
    meta.intake ? `Intake ${meta.intake}` : null,
    meta.tuition,
  ]
    .filter(Boolean)
    .join(" · ");
  const scholarshipMeta = [
    meta.funding_type,
    meta.deadline_at ? `Deadline ${formatDate(meta.deadline_at)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="apps-card catalogue-card">
      <div className="catalogue-card-heading">
        <StatusBadge tone={verified ? "green" : "amber"} icon={verified ? ShieldCheck : Lock}>
          {verified ? "Verified" : "Private research"}
        </StatusBadge>
        {kind === "institutions" && programmeCount != null ? (
          <span className="catalogue-programme-count" title={`${programmeCount} programmes offered`}>
            <BookOpen aria-hidden="true" />
            {programmeCount} {programmeCount === 1 ? "programme" : "programmes"}
          </span>
        ) : null}
        {kind === "scholarships" && meta.is_open === false ? (
          <span className="catalogue-closed-note">Closed</span>
        ) : null}
        {!verified ? <span className="catalogue-private-note">Visible only to you</span> : null}
      </div>
      <h3>
        <Link to={`/app/catalogue/${kind}/${item.id}`}>{item.name}</Link>
      </h3>
      {subtitle ? <p className="catalogue-card-subtitle">{subtitle}</p> : null}
      {scholarshipMeta ? <p className="catalogue-card-subtitle">{scholarshipMeta}</p> : null}
      <div className="catalogue-card-footer">
        <span className="catalogue-card-verified">
          {verified
            ? item.last_verified_at
              ? `Checked ${formatDate(item.last_verified_at)}`
              : "No verification information has been added"
            : "Personal research record"}
        </span>
        <div className="catalogue-card-actions">
          {onReportIssue ? (
            <button
              type="button"
              className="apps-icon-button catalogue-report-issue-button"
              title="Report issue with this catalogue item"
              aria-label="Report issue"
              onClick={() => onReportIssue(item)}
            >
              <Flag aria-hidden="true" />
            </button>
          ) : null}
          <Link
            className="apps-row-open"
            to={`/app/applications?create=1&catalogueType=${kindSingular[kind]}&catalogueId=${item.id}&title=${encodeURIComponent(item.name)}`}
          >
            Create application
          </Link>
          <Link className="apps-row-open" to={`/app/catalogue/${kind}/${item.id}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
