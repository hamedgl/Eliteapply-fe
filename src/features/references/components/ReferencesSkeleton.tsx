export function ReferencesSkeleton() {
  return (
    <div className="apps-skeleton" aria-busy="true" aria-label="Loading references">
      <div className="apps-skeleton-summary">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton apps-skeleton-summary-item" key={i} />
        ))}
      </div>
      <div className="skeleton apps-skeleton-toolbar" />
      <div className="apps-skeleton-table">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton apps-skeleton-row" key={i} />
        ))}
      </div>
    </div>
  );
}
