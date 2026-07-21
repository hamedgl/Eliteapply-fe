import { Link } from "react-router-dom";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { entityTypeLabel, fitLevel, type Match } from "../discoveryModel";

export function MatchCard({ match }: { match: Match }) {
  const fit = fitLevel(match.score);
  return (
    <article className="apps-card match-card">
      <div className="match-card-heading">
        <span className="match-card-type">{entityTypeLabel[match.type] ?? match.type}</span>
        <StatusBadge tone={fit.tone}>{fit.label}</StatusBadge>
      </div>
      <h3>{match.name}</h3>
      <p className="match-card-institution">
        {match.institution_name ?? "Institution details available in catalogue"}
      </p>
      {match.reasons.length ? (
        <ul className="match-card-reasons">
          {match.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <div className="match-card-footer">
        <span
          className="match-card-score"
          title="Based on available catalogue and academic-profile information. This does not predict admission."
        >
          Match score: {match.score}/100
        </span>
        <Link
          className="apps-row-open"
          to={`/app/applications?create=1&catalogueType=${match.type}&catalogueId=${match.id}&title=${encodeURIComponent(match.name)}`}
        >
          Create application
        </Link>
      </div>
    </article>
  );
}
