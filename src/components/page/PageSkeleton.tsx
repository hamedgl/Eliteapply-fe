import { useLocation } from "react-router-dom";

type CollectionVariant = "table" | "cards" | "board" | "timeline" | "stack";

const items = (count: number) =>
  Array.from({ length: count }, (_, index) => index);

function HeaderSkeleton({ actions = 2 }: { actions?: number }) {
  return (
    <header className="page-skeleton-header" aria-hidden="true">
      <div>
        <i className="skeleton skeleton-kicker" />
        <i className="skeleton skeleton-page-title" />
        <i className="skeleton skeleton-page-copy" />
      </div>
      <div className="page-skeleton-actions">
        {items(actions).map((item) => (
          <i className="skeleton skeleton-button" key={item} />
        ))}
      </div>
    </header>
  );
}

function SummarySkeleton({ count }: { count: number }) {
  return (
    <div className="page-skeleton-summary" aria-hidden="true">
      {items(count).map((item) => (
        <div className="skeleton-metric" key={item}>
          <i className="skeleton skeleton-metric-icon" />
          <span>
            <i className="skeleton skeleton-metric-value" />
            <i className="skeleton skeleton-metric-label" />
          </span>
        </div>
      ))}
    </div>
  );
}

function ToolbarSkeleton({
  controls,
  search = true,
}: {
  controls: number;
  search?: boolean;
}) {
  return (
    <div className="page-skeleton-toolbar" aria-hidden="true">
      {search ? <i className="skeleton skeleton-search-field" /> : null}
      {items(controls).map((item) => (
        <i className="skeleton skeleton-filter-field" key={item} />
      ))}
    </div>
  );
}

function TableSkeleton({
  rows,
  columns,
  selection = false,
}: {
  rows: number;
  columns: number;
  selection?: boolean;
}) {
  const primaryColumn = selection ? 1 : 0;
  return (
    <div
      className="page-skeleton-table"
      data-columns={columns}
      data-selection={selection || undefined}
      aria-hidden="true"
    >
      <div className="page-skeleton-table-head">
        {items(columns).map((item) => (
          <i className="skeleton" key={item} />
        ))}
      </div>
      {items(rows).map((row) => (
        <div className="page-skeleton-data-row" key={row}>
          {items(columns).map((column) => (
            <span
              className={
                column === primaryColumn ? "skeleton-primary-cell" : undefined
              }
              key={column}
            >
              {selection && column === 0 ? (
                <i className="skeleton skeleton-checkbox" />
              ) : null}
              {column === primaryColumn ? (
                <i className="skeleton skeleton-row-icon" />
              ) : null}
              <span>
                <i className="skeleton skeleton-cell-line" />
                {column === primaryColumn ? (
                  <i className="skeleton skeleton-cell-subline" />
                ) : null}
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({
  rows,
  columns = 3,
}: {
  rows: number;
  columns?: number;
}) {
  return (
    <div
      className="page-skeleton-card-grid"
      data-columns={columns}
      aria-hidden="true"
    >
      {items(rows).map((item) => (
        <article className="page-skeleton-card" key={item}>
          <header>
            <i className="skeleton skeleton-card-icon" />
            <i className="skeleton skeleton-card-badge" />
          </header>
          <i className="skeleton skeleton-card-title" />
          <i className="skeleton skeleton-card-copy" />
          <i className="skeleton skeleton-card-copy is-short" />
          <footer>
            <i className="skeleton skeleton-card-meta" />
            <i className="skeleton skeleton-card-action" />
          </footer>
        </article>
      ))}
    </div>
  );
}

function StackSkeleton({
  rows,
  selection = false,
}: {
  rows: number;
  selection?: boolean;
}) {
  return (
    <div
      className="page-skeleton-stack"
      data-selection={selection || undefined}
      aria-hidden="true"
    >
      {items(rows).map((item) => (
        <article key={item}>
          {selection ? <i className="skeleton skeleton-checkbox" /> : null}
          <span>
            <span className="page-skeleton-stack-heading">
              <i className="skeleton skeleton-card-title" />
              <i className="skeleton skeleton-card-badge" />
              <i className="skeleton skeleton-card-badge" />
            </span>
            <i className="skeleton skeleton-card-copy" />
            <i className="skeleton skeleton-card-meta" />
          </span>
          <i className="skeleton skeleton-card-action" />
        </article>
      ))}
    </div>
  );
}

function TimelineSkeleton({ rows }: { rows: number }) {
  return (
    <section className="page-skeleton-timeline" aria-hidden="true">
      <header>
        <span>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
        </span>
        <i className="skeleton skeleton-tabs" />
      </header>
      {items(rows).map((item) => (
        <article className="page-skeleton-timeline-row" key={item}>
          <i className="skeleton skeleton-timeline-dot" />
          <span>
            <i className="skeleton skeleton-card-badge" />
            <i className="skeleton skeleton-card-title" />
            <i className="skeleton skeleton-card-copy" />
          </span>
          <i className="skeleton skeleton-card-action" />
        </article>
      ))}
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div className="page-skeleton-board" aria-hidden="true">
      {items(5).map((column) => (
        <section key={column}>
          <header>
            <i className="skeleton skeleton-board-title" />
            <i className="skeleton skeleton-board-count" />
          </header>
          {items(column % 2 ? 2 : 3).map((card) => (
            <article key={card}>
              <i className="skeleton skeleton-card-badge" />
              <i className="skeleton skeleton-card-title" />
              <i className="skeleton skeleton-card-copy" />
              <footer>
                <i className="skeleton skeleton-card-meta" />
                <i className="skeleton skeleton-card-action" />
              </footer>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

export function SectionSkeleton({
  label,
  variant = "rows",
  rows = 3,
  columns = 4,
}: {
  label: string;
  variant?: "rows" | "cards" | "fields" | "table";
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="page-skeleton-section"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {variant === "cards" ? (
        <CardsSkeleton rows={rows} />
      ) : variant === "table" ? (
        <TableSkeleton rows={rows} columns={columns} />
      ) : variant === "fields" ? (
        <div className="page-skeleton-fields" aria-hidden="true">
          {items(rows).map((field) => (
            <span key={field}>
              <i className="skeleton skeleton-fact-label" />
              <i className="skeleton skeleton-form-field" />
            </span>
          ))}
        </div>
      ) : (
        <div className="page-skeleton-section-rows" aria-hidden="true">
          {items(rows).map((row) => (
            <div className="page-skeleton-detail-row" key={row}>
              <i className="skeleton skeleton-row-icon" />
              <span>
                <i className="skeleton skeleton-cell-line" />
                <i className="skeleton skeleton-cell-subline" />
              </span>
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CollectionPageSkeleton({
  label,
  summary = 4,
  controls = 3,
  rows = 5,
  columns = 5,
  variant = "table",
  cardColumns = 3,
  selection = false,
  search = true,
  toolbar = true,
  tabs = 0,
  actions = 2,
}: {
  label: string;
  summary?: number;
  controls?: number;
  rows?: number;
  columns?: number;
  variant?: CollectionVariant;
  cardColumns?: number;
  selection?: boolean;
  search?: boolean;
  toolbar?: boolean;
  tabs?: number;
  actions?: number;
}) {
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton actions={actions} />
      {summary ? <SummarySkeleton count={summary} /> : null}
      {tabs ? (
        <div className="page-skeleton-tab-row" aria-hidden="true">
          {items(tabs).map((tab) => (
            <i className="skeleton skeleton-tab" key={tab} />
          ))}
        </div>
      ) : null}
      {toolbar ? <ToolbarSkeleton controls={controls} search={search} /> : null}
      {variant === "board" ? (
        <BoardSkeleton />
      ) : variant === "cards" ? (
        <CardsSkeleton rows={rows} columns={cardColumns} />
      ) : variant === "stack" ? (
        <StackSkeleton rows={rows} selection={selection} />
      ) : variant === "timeline" ? (
        <TimelineSkeleton rows={rows} />
      ) : (
        <TableSkeleton rows={rows} columns={columns} selection={selection} />
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function WritingLibraryPageSkeleton({
  createOpen = false,
}: {
  createOpen?: boolean;
}) {
  return (
    <>
      <CollectionPageSkeleton
        label="Loading writing documents"
        variant="cards"
        cardColumns={2}
        summary={4}
        controls={5}
        actions={3}
      />
      {createOpen ? (
        <div className="page-skeleton-dialog-backdrop" aria-hidden="true">
          <section className="page-skeleton-dialog">
            <header>
              <span>
                <i className="skeleton skeleton-section-title" />
                <i className="skeleton skeleton-section-copy" />
              </span>
              <i className="skeleton skeleton-card-action" />
            </header>
            <div className="page-skeleton-tab-row">
              <i className="skeleton skeleton-tab" />
              <i className="skeleton skeleton-tab" />
            </div>
            <div className="page-skeleton-fields">
              {items(8).map((field) => (
                <span key={field}>
                  <i className="skeleton skeleton-fact-label" />
                  <i
                    className={`skeleton skeleton-form-field${field === 5 ? " is-textarea" : ""}`}
                  />
                </span>
              ))}
            </div>
            <footer>
              <i className="skeleton skeleton-button" />
              <i className="skeleton skeleton-button" />
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function CataloguePageSkeleton({
  kind = "institutions",
}: {
  kind?: CatalogueSkeletonKind;
}) {
  const controls = kind === "institutions" ? 3 : kind === "programmes" ? 5 : 4;
  return (
    <CollectionPageSkeleton
      label="Loading catalogue"
      variant="cards"
      cardColumns={3}
      summary={4}
      controls={controls}
      tabs={3}
      actions={4}
    />
  );
}

export function DetailPageSkeleton({
  label = "Loading details",
  tabs = 0,
  facts = 8,
  sections = 2,
  rows = 3,
  asideActions = 4,
}: {
  label?: string;
  tabs?: number;
  facts?: number;
  sections?: number;
  rows?: number;
  asideActions?: number;
}) {
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton actions={1} />
      {tabs ? (
        <div className="page-skeleton-tab-row" aria-hidden="true">
          {items(tabs).map((tab) => (
            <i className="skeleton skeleton-tab" key={tab} />
          ))}
        </div>
      ) : (
        <div className="page-skeleton-status" aria-hidden="true">
          <i className="skeleton skeleton-status-icon" />
          <span>
            <i className="skeleton skeleton-section-title" />
            <i className="skeleton skeleton-page-copy" />
          </span>
        </div>
      )}
      <div className="page-skeleton-detail-layout" aria-hidden="true">
        <main>
          <section className="page-skeleton-detail-card">
            <i className="skeleton skeleton-section-title" />
            <i className="skeleton skeleton-section-copy" />
            <div className="page-skeleton-facts">
              {items(facts).map((fact) => (
                <span key={fact}>
                  <i className="skeleton skeleton-fact-label" />
                  <i className="skeleton skeleton-fact-value" />
                </span>
              ))}
            </div>
          </section>
          {items(sections).map((section) => (
            <section className="page-skeleton-detail-card" key={section}>
              <i className="skeleton skeleton-section-title" />
              {items(rows).map((row) => (
                <div className="page-skeleton-detail-row" key={row}>
                  <i className="skeleton skeleton-row-icon" />
                  <span>
                    <i className="skeleton skeleton-cell-line" />
                    <i className="skeleton skeleton-cell-subline" />
                  </span>
                </div>
              ))}
            </section>
          ))}
        </main>
        <aside className="page-skeleton-detail-card">
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
          {items(asideActions).map((action) => (
            <i className="skeleton skeleton-detail-action" key={action} />
          ))}
        </aside>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type ProfileSkeletonSection =
  | "goals"
  | "education"
  | "interests"
  | "research"
  | "honors"
  | "tests"
  | "languages";

const profileSections: ProfileSkeletonSection[] = [
  "goals",
  "education",
  "interests",
  "research",
  "honors",
  "tests",
  "languages",
];

export function ProfilePageSkeleton({
  label = "Loading academic profile",
  section = "goals",
}: {
  label?: string;
  section?: ProfileSkeletonSection;
}) {
  const fieldCount = section === "goals" ? 8 : 2;
  const repeatable = section !== "goals" && section !== "interests";
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton />
      <div
        className="page-skeleton-profile-layout"
        data-section={section}
        aria-hidden="true"
      >
        <aside>
          <section className="page-skeleton-profile-health">
            <span>
              <i className="skeleton skeleton-section-title" />
              <i className="skeleton skeleton-board-count" />
            </span>
            <i className="skeleton skeleton-profile-progress" />
            <i className="skeleton skeleton-card-meta" />
          </section>
          <nav>
            {profileSections.map((item) => (
              <span key={item}>
                <i className="skeleton skeleton-row-icon" />
                <i className="skeleton skeleton-cell-line" />
                <i className="skeleton skeleton-board-count" />
              </span>
            ))}
          </nav>
        </aside>
        <section>
          <header>
            <i className="skeleton skeleton-card-icon" />
            <span>
              <i className="skeleton skeleton-section-title" />
              <i className="skeleton skeleton-section-copy" />
            </span>
          </header>
          {repeatable ? (
            <div className="page-skeleton-profile-entries">
              {items(2).map((entry) => (
                <span key={entry}>
                  <i className="skeleton skeleton-row-icon" />
                  <span>
                    <i className="skeleton skeleton-cell-line" />
                    <i className="skeleton skeleton-cell-subline" />
                  </span>
                  <i className="skeleton skeleton-card-action" />
                </span>
              ))}
              <i className="skeleton skeleton-button" />
            </div>
          ) : (
            <div className="page-skeleton-fields">
              {items(fieldCount).map((field) => (
                <label key={field}>
                  <i className="skeleton skeleton-fact-label" />
                  <i
                    className={`skeleton skeleton-form-field${section === "interests" && field === 1 ? " is-textarea" : ""}`}
                  />
                </label>
              ))}
            </div>
          )}
          <footer>
            <i className="skeleton skeleton-button" />
            <i className="skeleton skeleton-button" />
          </footer>
        </section>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ChoiceGridSkeleton({
  count,
  columns = 3,
}: {
  count: number;
  columns?: number;
}) {
  return (
    <div className="page-skeleton-choice-grid" data-columns={columns}>
      {items(count).map((choice) => (
        <span key={choice}>
          <i className="skeleton skeleton-checkbox" />
          <i className="skeleton skeleton-cell-line" />
          <i className="skeleton skeleton-cell-subline" />
        </span>
      ))}
    </div>
  );
}

export function ReferenceRequestPageSkeleton() {
  return (
    <div
      className="page page-skeleton page-skeleton-request"
      role="status"
      aria-busy="true"
      aria-label="Loading reference request"
    >
      <header aria-hidden="true">
        <span>
          <i className="skeleton skeleton-back-link" />
          <i className="skeleton skeleton-page-title" />
        </span>
        <i className="skeleton skeleton-button" />
      </header>
      <ol aria-hidden="true">
        {items(4).map((step) => (
          <li key={step}>
            <i className="skeleton skeleton-board-count" />
            <i className="skeleton skeleton-cell-line" />
          </li>
        ))}
      </ol>
      <section aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <ChoiceGridSkeleton count={3} />
      </section>
      <footer aria-hidden="true">
        <i className="skeleton skeleton-button" />
        <i className="skeleton skeleton-button" />
      </footer>
      <span className="sr-only">Loading reference request</span>
    </div>
  );
}

export function InterviewSetupPageSkeleton() {
  return (
    <div
      className="page apps-page page-skeleton page-skeleton-interview-setup"
      role="status"
      aria-busy="true"
      aria-label="Loading interview setup"
    >
      <i className="skeleton skeleton-back-link" aria-hidden="true" />
      <HeaderSkeleton actions={2} />
      <form aria-hidden="true">
        <fieldset>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-form-field" />
        </fieldset>
        <fieldset>
          <i className="skeleton skeleton-section-title" />
          <ChoiceGridSkeleton count={8} />
        </fieldset>
        <fieldset>
          <i className="skeleton skeleton-section-title" />
          <ChoiceGridSkeleton count={6} columns={6} />
        </fieldset>
        <fieldset>
          <i className="skeleton skeleton-section-title" />
          <ChoiceGridSkeleton count={3} />
        </fieldset>
        <i className="skeleton skeleton-button" />
      </form>
      <span className="sr-only">Loading interview setup</span>
    </div>
  );
}

export function EditorPageSkeleton({
  label = "Loading editor",
}: {
  label?: string;
}) {
  return (
    <div
      className="page-skeleton page-skeleton-editor"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton actions={7} />
      <div className="page-skeleton-editor-layout" aria-hidden="true">
        <aside>
          {items(5).map((item) => (
            <i className="skeleton skeleton-cell-line" key={item} />
          ))}
        </aside>
        <main>
          <div className="page-skeleton-editor-toolbar">
            {items(8).map((tool) => (
              <i className="skeleton" key={tool} />
            ))}
          </div>
          <section>
            <i className="skeleton skeleton-editor-title" />
            {items(12).map((line) => (
              <i
                className={`skeleton skeleton-editor-line${line % 4 === 3 ? " is-short" : ""}`}
                key={line}
              />
            ))}
          </section>
        </main>
        <aside className="page-skeleton-editor-context">
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
          <i className="skeleton skeleton-detail-action" />
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-form-field" />
          <i className="skeleton skeleton-form-field is-textarea" />
          <i className="skeleton skeleton-button" />
        </aside>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CalendarGridSkeleton({
  label = "Loading calendar",
}: {
  label?: string;
}) {
  return (
    <div
      className="page-skeleton-calendar"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <header aria-hidden="true">
        <i className="skeleton skeleton-button" />
        <i className="skeleton skeleton-section-title" />
        <i className="skeleton skeleton-button" />
      </header>
      <div className="page-skeleton-calendar-week" aria-hidden="true">
        {items(7).map((day) => (
          <i className="skeleton" key={day} />
        ))}
      </div>
      <div className="page-skeleton-calendar-grid" aria-hidden="true">
        {items(35).map((day) => (
          <span key={day}>
            <i className="skeleton skeleton-calendar-date" />
            {day % 3 === 0 ? (
              <i className="skeleton skeleton-calendar-event" />
            ) : null}
            {day % 8 === 0 ? (
              <i className="skeleton skeleton-calendar-event is-muted" />
            ) : null}
          </span>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading reminders calendar"
    >
      <HeaderSkeleton />
      <SummarySkeleton count={3} />
      <div className="page-skeleton-tab-row" aria-hidden="true">
        <i className="skeleton skeleton-tab" />
        <i className="skeleton skeleton-tab" />
      </div>
      <CalendarGridSkeleton />
      <span className="sr-only">Loading reminders calendar</span>
    </div>
  );
}

export function BillingPageSkeleton() {
  return (
    <div
      className="page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading billing and usage"
    >
      <HeaderSkeleton actions={0} />
      <div className="page-skeleton-tab-row" aria-hidden="true">
        {items(4).map((tab) => (
          <i className="skeleton skeleton-tab" key={tab} />
        ))}
      </div>
      <SummarySkeleton count={2} />
      <section className="page-skeleton-billing-section" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <i className="skeleton skeleton-section-copy" />
        <CardsSkeleton rows={2} columns={2} />
      </section>
      <section className="page-skeleton-billing-section" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <div className="page-skeleton-fields">
          {items(2).map((field) => (
            <i className="skeleton skeleton-form-field" key={field} />
          ))}
        </div>
      </section>
      <section className="page-skeleton-billing-section" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <i className="skeleton skeleton-section-copy" />
        <TableSkeleton rows={5} columns={3} />
      </section>
      <span className="sr-only">Loading billing and usage</span>
    </div>
  );
}

export function StackedDetailPageSkeleton({
  label,
  facts = 6,
  sections = 3,
}: {
  label: string;
  facts?: number;
  sections?: number;
}) {
  return (
    <div
      className="page apps-page page-skeleton page-skeleton-stacked-detail"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton actions={3} />
      <div className="page-skeleton-badges" aria-hidden="true">
        {items(3).map((badge) => (
          <i className="skeleton skeleton-card-badge" key={badge} />
        ))}
      </div>
      <section className="page-skeleton-callout" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <i className="skeleton skeleton-page-copy" />
      </section>
      <section className="page-skeleton-detail-card" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <div className="page-skeleton-facts">
          {items(facts).map((fact) => (
            <span key={fact}>
              <i className="skeleton skeleton-fact-label" />
              <i className="skeleton skeleton-fact-value" />
            </span>
          ))}
        </div>
      </section>
      {items(sections).map((section) => (
        <section
          className="page-skeleton-detail-card"
          aria-hidden="true"
          key={section}
        >
          <i className="skeleton skeleton-section-title" />
          <div className="page-skeleton-section-rows">
            {items(section === 0 ? 3 : 2).map((row) => (
              <div className="page-skeleton-detail-row" key={row}>
                <i className="skeleton skeleton-timeline-dot" />
                <span>
                  <i className="skeleton skeleton-cell-line" />
                  <i className="skeleton skeleton-cell-subline" />
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type CatalogueSkeletonKind =
  | "institutions"
  | "programmes"
  | "scholarships";

export function CatalogueRecordPageSkeleton({
  kind = "programmes",
}: {
  kind?: CatalogueSkeletonKind;
}) {
  const facts = kind === "institutions" ? 5 : kind === "scholarships" ? 8 : 9;
  return (
    <div
      className="page apps-page page-skeleton page-skeleton-catalogue-record"
      role="status"
      aria-busy="true"
      aria-label="Loading catalogue record"
      data-kind={kind}
    >
      <i className="skeleton skeleton-back-link" aria-hidden="true" />
      <HeaderSkeleton actions={0} />
      <section className="page-skeleton-detail-card" aria-hidden="true">
        <div className="page-skeleton-facts">
          {items(facts).map((fact) => (
            <span key={fact}>
              <i className="skeleton skeleton-fact-label" />
              <i className="skeleton skeleton-fact-value" />
            </span>
          ))}
        </div>
      </section>
      <div className="page-skeleton-actions" aria-hidden="true">
        {items(2).map((action) => (
          <i className="skeleton skeleton-button" key={action} />
        ))}
      </div>
      <span className="sr-only">Loading catalogue record</span>
    </div>
  );
}

export function SharedWritingPageSkeleton() {
  return (
    <div
      className="page-skeleton page-skeleton-shared"
      role="status"
      aria-busy="true"
      aria-label="Opening shared document"
    >
      <header aria-hidden="true">
        <i className="skeleton skeleton-shared-brand" />
        <i className="skeleton skeleton-card-meta" />
      </header>
      <main aria-hidden="true">
        <article>
          <i className="skeleton skeleton-card-badge" />
          <i className="skeleton skeleton-shared-title" />
          <i className="skeleton skeleton-card-meta" />
          <div className="page-skeleton-shared-copy">
            {items(14).map((line) => (
              <i
                className={`skeleton skeleton-editor-line${line % 5 === 4 ? " is-short" : ""}`}
                key={line}
              />
            ))}
          </div>
        </article>
        <aside>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
          <i className="skeleton skeleton-form-field" />
          <i className="skeleton skeleton-form-field is-textarea" />
          <i className="skeleton skeleton-button" />
        </aside>
      </main>
      <span className="sr-only">Opening shared document</span>
    </div>
  );
}

export function AuthPageSkeleton({
  fields = 2,
  oauth = false,
  label = "Loading account form",
}: {
  fields?: number;
  oauth?: boolean;
  label?: string;
}) {
  return (
    <main
      className="page-skeleton page-skeleton-auth"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <section aria-hidden="true">
        <i className="skeleton skeleton-shared-brand" />
        <span>
          <i className="skeleton skeleton-page-title" />
          <i className="skeleton skeleton-page-copy" />
          <i className="skeleton skeleton-page-copy" />
        </span>
      </section>
      <section aria-hidden="true">
        <form>
          <i className="skeleton skeleton-page-title" />
          <i className="skeleton skeleton-page-copy" />
          {oauth ? <i className="skeleton skeleton-auth-oauth" /> : null}
          {items(fields).map((field) => (
            <label key={field}>
              <i className="skeleton skeleton-fact-label" />
              <i className="skeleton skeleton-form-field" />
            </label>
          ))}
          <i className="skeleton skeleton-button" />
        </form>
      </section>
      <span className="sr-only">{label}</span>
    </main>
  );
}

function PublicVerificationSkeleton() {
  return (
    <>
      <section className="page-skeleton-facts" aria-hidden="true">
        {items(6).map((fact) => (
          <span key={fact}>
            <i className="skeleton skeleton-fact-label" />
            <i className="skeleton skeleton-fact-value" />
          </span>
        ))}
      </section>
      <section className="page-skeleton-public-download" aria-hidden="true">
        <span>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
        </span>
        <i className="skeleton skeleton-button" />
      </section>
    </>
  );
}

export function PublicFlowPageSkeleton({
  variant,
  embedded = false,
}: {
  variant: "code" | "verify" | "state";
  embedded?: boolean;
}) {
  if (embedded)
    return (
      <div
        className="page-skeleton page-skeleton-public-content"
        role="status"
        aria-busy="true"
        aria-label="Checking reference"
      >
        <PublicVerificationSkeleton />
      </div>
    );
  return (
    <main
      className="page-skeleton page-skeleton-public-flow"
      role="status"
      aria-busy="true"
      aria-label={
        variant === "verify"
          ? "Checking reference"
          : variant === "code"
            ? "Opening reference request"
            : "Opening invitation"
      }
    >
      <i className="skeleton skeleton-shared-brand" aria-hidden="true" />
      <i className="skeleton skeleton-page-title" aria-hidden="true" />
      {variant === "verify" ? (
        <PublicVerificationSkeleton />
      ) : variant === "code" ? (
        <section className="page-skeleton-public-form" aria-hidden="true">
          <i className="skeleton skeleton-section-copy" />
          <i className="skeleton skeleton-fact-label" />
          <i className="skeleton skeleton-form-field" />
          <i className="skeleton skeleton-button" />
        </section>
      ) : (
        <i className="skeleton skeleton-page-copy" aria-hidden="true" />
      )}
      <span className="sr-only">Loading</span>
    </main>
  );
}

function AdminDetailSkeleton() {
  return (
    <>
      <div className="page-skeleton-tab-row" aria-hidden="true">
        {items(4).map((tab) => (
          <i className="skeleton skeleton-tab" key={tab} />
        ))}
      </div>
      <section className="page-skeleton-detail-card" aria-hidden="true">
        <i className="skeleton skeleton-section-title" />
        <div className="page-skeleton-facts">
          {items(8).map((fact) => (
            <span key={fact}>
              <i className="skeleton skeleton-fact-label" />
              <i className="skeleton skeleton-fact-value" />
            </span>
          ))}
        </div>
        {items(4).map((row) => (
          <div className="page-skeleton-detail-row" key={row}>
            <i className="skeleton skeleton-row-icon" />
            <span>
              <i className="skeleton skeleton-cell-line" />
              <i className="skeleton skeleton-cell-subline" />
            </span>
          </div>
        ))}
      </section>
    </>
  );
}

export function AdminPageSkeleton({
  path = "/admin",
  embedded = false,
}: {
  path?: string;
  embedded?: boolean;
}) {
  const detail =
    /^\/admin\/users\/[^/]+/.test(path) ||
    /^\/admin\/operations\/[^/]+/.test(path);
  const cards =
    path === "/admin" || path === "/admin/launch" || path === "/admin/queues";
  const columns =
    path === "/admin/users" || path === "/admin/audit-log" ? 6 : 5;
  if (embedded)
    return (
      <div
        className="page-skeleton page-skeleton-admin-embedded"
        role="status"
        aria-busy="true"
        aria-label="Loading admin record"
      >
        <HeaderSkeleton actions={2} />
        <AdminDetailSkeleton />
      </div>
    );
  return (
    <div
      className="page-skeleton page-skeleton-admin"
      role="status"
      aria-busy="true"
      aria-label="Loading administration workspace"
    >
      <aside aria-hidden="true">
        <i className="skeleton skeleton-shared-brand" />
        {items(9).map((item) => (
          <span key={item}>
            <i className="skeleton skeleton-row-icon" />
            <i className="skeleton skeleton-cell-line" />
          </span>
        ))}
      </aside>
      <main>
        <HeaderSkeleton actions={2} />
        {detail ? (
          <AdminDetailSkeleton />
        ) : cards ? (
          <>
            <SummarySkeleton count={4} />
            <CardsSkeleton rows={6} columns={3} />
          </>
        ) : (
          <>
            <ToolbarSkeleton controls={3} />
            <TableSkeleton rows={6} columns={columns} />
          </>
        )}
      </main>
      <span className="sr-only">Loading administration workspace</span>
    </div>
  );
}

export function AdminRoutePageSkeleton({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  return (
    <AdminPageSkeleton
      path={useLocation().pathname.replace(/\/$/, "")}
      embedded={embedded}
    />
  );
}

export function SettingsPageSkeleton({
  label,
  sections,
  photo = false,
}: {
  label: string;
  sections: readonly number[];
  photo?: boolean;
}) {
  return (
    <div
      className="page page-skeleton page-skeleton-settings"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <HeaderSkeleton actions={1} />
      <div className="page-skeleton-settings-tabs" aria-hidden="true">
        {items(4).map((tab) => (
          <i className="skeleton skeleton-tab" key={tab} />
        ))}
      </div>
      <div className="page-skeleton-settings-sections" aria-hidden="true">
        {sections.map((fieldCount, section) => (
          <section key={section}>
            <header>
              <i className="skeleton skeleton-section-title" />
              <i className="skeleton skeleton-section-copy" />
            </header>
            {photo && section === 0 ? (
              <div className="page-skeleton-settings-photo">
                <i className="skeleton skeleton-dashboard-ring" />
                <span>
                  <i className="skeleton skeleton-button" />
                  <i className="skeleton skeleton-section-copy" />
                </span>
              </div>
            ) : (
              <div className="page-skeleton-fields">
                {items(fieldCount).map((field) => (
                  <span key={field}>
                    <i className="skeleton skeleton-fact-label" />
                    <i className="skeleton skeleton-form-field" />
                  </span>
                ))}
              </div>
            )}
            {photo && section === 0 ? null : (
              <footer>
                <i className="skeleton skeleton-button" />
              </footer>
            )}
          </section>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ImportPageSkeleton() {
  return (
    <div
      className="page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading opportunity import"
    >
      <HeaderSkeleton actions={1} />
      <div className="page-skeleton-import-layout" aria-hidden="true">
        <section>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
          <div className="page-skeleton-fields">
            {items(3).map((field) => (
              <span key={field}>
                <i className="skeleton skeleton-fact-label" />
                <i className="skeleton skeleton-form-field" />
              </span>
            ))}
          </div>
          <i className="skeleton skeleton-button" />
        </section>
        <section>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-section-copy" />
          <StackSkeleton rows={4} />
        </section>
      </div>
      <span className="sr-only">Loading opportunity import</span>
    </div>
  );
}

export function InterviewSessionSkeleton() {
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Restoring interview session"
    >
      <HeaderSkeleton actions={3} />
      <div className="page-skeleton-interview-layout" aria-hidden="true">
        <main>
          {items(2).map((exchange) => (
            <section key={exchange}>
              <div className="page-skeleton-interview-bubble">
                <i className="skeleton skeleton-card-meta" />
                <i className="skeleton skeleton-card-copy" />
                <i className="skeleton skeleton-card-copy is-short" />
              </div>
              <div className="page-skeleton-interview-bubble is-answer">
                <i className="skeleton skeleton-card-meta" />
                <i className="skeleton skeleton-card-copy" />
              </div>
            </section>
          ))}
          <section className="page-skeleton-interview-composer">
            <i className="skeleton skeleton-section-title" />
            <i className="skeleton skeleton-interview-textarea" />
            <i className="skeleton skeleton-button" />
          </section>
        </main>
        <aside>
          <i className="skeleton skeleton-section-title" />
          <i className="skeleton skeleton-dashboard-ring" />
          {items(4).map((item) => (
            <i className="skeleton skeleton-detail-action" key={item} />
          ))}
        </aside>
      </div>
      <span className="sr-only">Restoring interview session</span>
    </div>
  );
}

export type ApplicationSkeletonTab =
  | "overview"
  | "requirements"
  | "tasks"
  | "documents"
  | "linked"
  | "eligibility"
  | "collaborators"
  | "activity";

const applicationTabs: ApplicationSkeletonTab[] = [
  "overview",
  "requirements",
  "tasks",
  "documents",
  "linked",
  "eligibility",
  "collaborators",
  "activity",
];

export function ApplicationWorkspacePageSkeleton({
  tab = "overview",
}: {
  tab?: ApplicationSkeletonTab;
}) {
  const rows = tab === "activity" ? 6 : tab === "tasks" ? 5 : 4;
  return (
    <div
      className="page apps-page page-skeleton"
      role="status"
      aria-busy="true"
      aria-label={`Loading application ${tab}`}
    >
      <HeaderSkeleton actions={4} />
      <div className="page-skeleton-tab-row" aria-hidden="true">
        {applicationTabs.map((item) => (
          <i className="skeleton skeleton-tab" key={item} />
        ))}
      </div>
      {tab === "overview" ? (
        <div className="page-skeleton-detail-layout" aria-hidden="true">
          <main>
            {items(3).map((section) => (
              <section className="page-skeleton-detail-card" key={section}>
                <i className="skeleton skeleton-section-title" />
                <i className="skeleton skeleton-section-copy" />
                <div className="page-skeleton-facts">
                  {items(section === 0 ? 6 : 3).map((fact) => (
                    <span key={fact}>
                      <i className="skeleton skeleton-fact-label" />
                      <i className="skeleton skeleton-fact-value" />
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </main>
          <aside className="page-skeleton-detail-card">
            <i className="skeleton skeleton-section-title" />
            <i className="skeleton skeleton-dashboard-ring" />
            {items(4).map((row) => (
              <i className="skeleton skeleton-detail-action" key={row} />
            ))}
          </aside>
        </div>
      ) : (
        <section className="page-skeleton-resource" aria-hidden="true">
          <header>
            <span>
              <i className="skeleton skeleton-section-title" />
              <i className="skeleton skeleton-section-copy" />
            </span>
            <i className="skeleton skeleton-button" />
          </header>
          {tab === "eligibility" ? (
            <div className="page-skeleton-detail-layout">
              <StackSkeleton rows={4} />
              <aside className="page-skeleton-detail-card">
                <i className="skeleton skeleton-section-title" />
                <i className="skeleton skeleton-dashboard-ring" />
                <i className="skeleton skeleton-detail-action" />
              </aside>
            </div>
          ) : (
            <StackSkeleton rows={rows} />
          )}
        </section>
      )}
      <span className="sr-only">Loading application {tab}</span>
    </div>
  );
}

type SkeletonBlueprint =
  | { kind: "collection"; props: Parameters<typeof CollectionPageSkeleton>[0] }
  | { kind: "detail"; props: Parameters<typeof DetailPageSkeleton>[0] }
  | {
      kind: "stacked-detail";
      props: Parameters<typeof StackedDetailPageSkeleton>[0];
    }
  | { kind: "catalogue-record" }
  | { kind: "shared-writing" }
  | { kind: "settings"; props: Parameters<typeof SettingsPageSkeleton>[0] }
  | { kind: "profile" }
  | { kind: "dashboard" }
  | { kind: "editor" }
  | { kind: "calendar" }
  | { kind: "billing" }
  | { kind: "import" }
  | { kind: "interview-session" }
  | { kind: "interview-setup" }
  | { kind: "reference-request" }
  | { kind: "public-flow"; variant: "code" | "verify" | "state" }
  | { kind: "admin" }
  | { kind: "catalogue" };

export const PAGE_SKELETON_BLUEPRINTS = {
  dashboard: { kind: "dashboard" },
  applicationsBoard: {
    kind: "collection",
    props: {
      label: "Loading applications",
      variant: "board",
      summary: 4,
      controls: 6,
      actions: 4,
    },
  },
  applicationsList: {
    kind: "collection",
    props: {
      label: "Loading applications",
      columns: 9,
      selection: true,
      summary: 4,
      controls: 6,
      actions: 4,
      rows: 6,
    },
  },
  opportunityImport: { kind: "import" },
  academicProfile: { kind: "profile" },
  documents: {
    kind: "collection",
    props: {
      label: "Loading documents",
      columns: 7,
      selection: true,
      summary: 4,
      controls: 3,
      actions: 3,
    },
  },
  documentDetail: {
    kind: "detail",
    props: {
      label: "Loading document details",
      facts: 8,
      sections: 3,
      rows: 3,
      asideActions: 5,
    },
  },
  catalogue: {
    kind: "catalogue",
  },
  catalogueDetail: {
    kind: "catalogue-record",
  },
  discoveryRecommended: {
    kind: "collection",
    props: {
      label: "Loading recommendations",
      variant: "cards",
      cardColumns: 3,
      summary: 3,
      controls: 1,
      search: false,
      tabs: 2,
      actions: 3,
    },
  },
  discoverySaved: {
    kind: "collection",
    props: {
      label: "Loading saved searches",
      variant: "stack",
      summary: 3,
      toolbar: false,
      tabs: 2,
      actions: 3,
    },
  },
  writingLibrary: {
    kind: "collection",
    props: {
      label: "Loading writing documents",
      variant: "cards",
      cardColumns: 2,
      summary: 4,
      controls: 5,
      actions: 3,
    },
  },
  writingEditor: { kind: "editor" },
  stories: {
    kind: "collection",
    props: {
      label: "Loading stories",
      variant: "stack",
      summary: 4,
      controls: 3,
      actions: 3,
      rows: 5,
    },
  },
  references: {
    kind: "collection",
    props: {
      label: "Loading references",
      columns: 8,
      summary: 4,
      controls: 4,
      actions: 3,
      rows: 6,
    },
  },
  referenceNew: { kind: "reference-request" },
  referenceDetail: {
    kind: "stacked-detail",
    props: { label: "Loading reference details", facts: 6, sections: 3 },
  },
  interviews: {
    kind: "collection",
    props: {
      label: "Loading practice history",
      variant: "cards",
      cardColumns: 3,
      summary: 0,
      toolbar: false,
      actions: 3,
      rows: 3,
    },
  },
  interviewNew: { kind: "interview-setup" },
  interviewDetail: { kind: "interview-session" },
  notifications: {
    kind: "collection",
    props: {
      label: "Loading notifications",
      variant: "timeline",
      summary: 2,
      toolbar: false,
      actions: 3,
      rows: 4,
    },
  },
  remindersList: {
    kind: "collection",
    props: {
      label: "Loading reminders",
      variant: "stack",
      summary: 3,
      search: false,
      controls: 2,
      tabs: 2,
      actions: 3,
      rows: 5,
      selection: true,
    },
  },
  remindersCalendar: { kind: "calendar" },
  profileSettings: {
    kind: "settings",
    props: { label: "Loading profile settings", sections: [1, 5], photo: true },
  },
  securitySettings: {
    kind: "settings",
    props: { label: "Loading security settings", sections: [2] },
  },
  privacySettings: {
    kind: "settings",
    props: { label: "Loading privacy settings", sections: [0, 1, 1] },
  },
  billing: { kind: "billing" },
  admin: { kind: "admin" },
  sharedWriting: { kind: "shared-writing" },
  publicReference: { kind: "public-flow", variant: "verify" },
  invitation: { kind: "public-flow", variant: "state" },
} as const satisfies Record<string, SkeletonBlueprint>;

export type PageSkeletonKey = keyof typeof PAGE_SKELETON_BLUEPRINTS;

export function GeneratedPageSkeleton({ page }: { page: PageSkeletonKey }) {
  const blueprint: SkeletonBlueprint = PAGE_SKELETON_BLUEPRINTS[page];
  switch (blueprint.kind) {
    case "collection":
      return <CollectionPageSkeleton {...blueprint.props} />;
    case "detail":
      return <DetailPageSkeleton {...blueprint.props} />;
    case "stacked-detail":
      return <StackedDetailPageSkeleton {...blueprint.props} />;
    case "catalogue-record":
      return <CatalogueRecordPageSkeleton />;
    case "shared-writing":
      return <SharedWritingPageSkeleton />;
    case "settings":
      return <SettingsPageSkeleton {...blueprint.props} />;
    case "profile":
      return <ProfilePageSkeleton />;
    case "dashboard":
      return <DashboardPageSkeleton />;
    case "editor":
      return <EditorPageSkeleton />;
    case "calendar":
      return <CalendarPageSkeleton />;
    case "billing":
      return <BillingPageSkeleton />;
    case "import":
      return <ImportPageSkeleton />;
    case "interview-session":
      return <InterviewSessionSkeleton />;
    case "interview-setup":
      return <InterviewSetupPageSkeleton />;
    case "reference-request":
      return <ReferenceRequestPageSkeleton />;
    case "public-flow":
      return <PublicFlowPageSkeleton variant={blueprint.variant} />;
    case "admin":
      return <AdminPageSkeleton />;
    case "catalogue":
      return <CataloguePageSkeleton />;
  }
}

export function DashboardPageSkeleton() {
  return (
    <div
      className="page dashboard page-skeleton dashboard-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <HeaderSkeleton />
      <section className="page-skeleton-dashboard-focus" aria-hidden="true">
        <i className="skeleton skeleton-dashboard-ring" />
        <span>
          <i className="skeleton skeleton-kicker" />
          <i className="skeleton skeleton-card-title" />
          <i className="skeleton skeleton-page-copy" />
          <i className="skeleton skeleton-button" />
        </span>
        <i className="skeleton skeleton-dashboard-art" />
      </section>
      <div className="page-skeleton-dashboard-grid" aria-hidden="true">
        <section className="page-skeleton-dashboard-wide">
          <i className="skeleton skeleton-section-title" />
          <div>
            <i className="skeleton skeleton-dashboard-ring" />
            <span>
              {items(5).map((row) => (
                <i className="skeleton skeleton-cell-line" key={row} />
              ))}
            </span>
          </div>
        </section>
        {items(2).map((card) => (
          <section key={card}>
            <i className="skeleton skeleton-section-title" />
            {items(4).map((row) => (
              <i className="skeleton skeleton-detail-action" key={row} />
            ))}
          </section>
        ))}
      </div>
      <div
        className="page-skeleton-dashboard-grid is-secondary"
        aria-hidden="true"
      >
        {items(3).map((card) => (
          <section key={card}>
            <i className="skeleton skeleton-section-title" />
            {card === 0 ? (
              <i className="skeleton skeleton-calendar-event" />
            ) : null}
            {items(card === 2 ? 5 : 4).map((row) => (
              <i className="skeleton skeleton-detail-action" key={row} />
            ))}
          </section>
        ))}
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}

export function RoutePageSkeleton() {
  const { pathname, search } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const params = new URLSearchParams(search);

  if (
    [
      "/login",
      "/register",
      "/confirm-email",
      "/forgot-password",
      "/reset-password",
      "/auth/callback",
    ].includes(path)
  ) {
    const fields =
      path === "/register"
        ? 3
        : path === "/forgot-password" || path === "/auth/callback"
          ? 1
          : path === "/reset-password"
            ? params.has("email") && params.has("code")
              ? 2
              : 4
            : 2;
    return (
      <AuthPageSkeleton
        fields={fields}
        oauth={path === "/login" || path === "/register"}
      />
    );
  }

  if (path === "/app/dashboard" || path === "/app/onboarding")
    return <GeneratedPageSkeleton page="dashboard" />;
  if (path === "/app/academic-profile") {
    const requested = params.get("section") as ProfileSkeletonSection | null;
    return (
      <ProfilePageSkeleton
        section={
          requested && profileSections.includes(requested) ? requested : "goals"
        }
      />
    );
  }
  if (path === "/app/applications/import")
    return <GeneratedPageSkeleton page="opportunityImport" />;
  if (/^\/app\/applications\/[^/]+/.test(path)) {
    const requested = path.split("/")[4] ?? "overview";
    const aliases: Record<string, ApplicationSkeletonTab> = {
      checklist: "requirements",
      checklists: "requirements",
      requirement: "requirements",
      task: "tasks",
      todo: "tasks",
      docs: "documents",
      files: "documents",
      reference: "linked",
      references: "linked",
      collaboration: "collaborators",
    };
    const tab = applicationTabs.includes(requested as ApplicationSkeletonTab)
      ? (requested as ApplicationSkeletonTab)
      : (aliases[requested] ?? "overview");
    return <ApplicationWorkspacePageSkeleton tab={tab} />;
  }
  if (path === "/app/applications")
    return (
      <GeneratedPageSkeleton
        page={
          params.get("view") === "list"
            ? "applicationsList"
            : "applicationsBoard"
        }
      />
    );
  if (/^\/app\/documents\/[^/]+$/.test(path))
    return <GeneratedPageSkeleton page="documentDetail" />;
  if (path === "/app/documents")
    return <GeneratedPageSkeleton page="documents" />;
  if (/^\/app\/catalogue\/[^/]+\/[^/]+$/.test(path)) {
    const kind = path.split("/")[3] as CatalogueSkeletonKind;
    return <CatalogueRecordPageSkeleton kind={kind} />;
  }
  if (path === "/app/catalogue") {
    const kind = params.get("kind") as CatalogueSkeletonKind | null;
    return (
      <CataloguePageSkeleton
        kind={
          kind && ["institutions", "programmes", "scholarships"].includes(kind)
            ? kind
            : "institutions"
        }
      />
    );
  }
  if (path === "/app/discovery")
    return (
      <GeneratedPageSkeleton
        page={
          params.get("tab") === "saved"
            ? "discoverySaved"
            : "discoveryRecommended"
        }
      />
    );
  if (path === "/app/writing/new")
    return <WritingLibraryPageSkeleton createOpen />;
  if (path === "/app/writing")
    return <GeneratedPageSkeleton page="writingLibrary" />;
  if (/^\/app\/writing\/[^/]+$/.test(path))
    return <GeneratedPageSkeleton page="writingEditor" />;
  if (path === "/app/stories") return <GeneratedPageSkeleton page="stories" />;
  if (path === "/app/references/new")
    return <GeneratedPageSkeleton page="referenceNew" />;
  if (/^\/app\/references\/[^/]+$/.test(path))
    return <GeneratedPageSkeleton page="referenceDetail" />;
  if (path === "/app/references")
    return <GeneratedPageSkeleton page="references" />;
  if (path === "/app/interviews/new")
    return <GeneratedPageSkeleton page="interviewNew" />;
  if (/^\/app\/interviews\/[^/]+$/.test(path))
    return <GeneratedPageSkeleton page="interviewDetail" />;
  if (path === "/app/interviews")
    return <GeneratedPageSkeleton page="interviews" />;
  if (path === "/app/notifications")
    return <GeneratedPageSkeleton page="notifications" />;
  if (path === "/app/reminders")
    return (
      <GeneratedPageSkeleton
        page={
          params.get("view") === "calendar"
            ? "remindersCalendar"
            : "remindersList"
        }
      />
    );
  if (path.startsWith("/app/settings/billing"))
    return <GeneratedPageSkeleton page="billing" />;
  if (path === "/app/settings/security")
    return <GeneratedPageSkeleton page="securitySettings" />;
  if (path === "/app/settings/privacy")
    return <GeneratedPageSkeleton page="privacySettings" />;
  if (path === "/app/settings/profile")
    return <GeneratedPageSkeleton page="profileSettings" />;
  if (path.startsWith("/share/"))
    return <GeneratedPageSkeleton page="sharedWriting" />;
  if (path.startsWith("/referee/"))
    return <PublicFlowPageSkeleton variant="code" />;
  if (path.startsWith("/verify/"))
    return <PublicFlowPageSkeleton variant="verify" />;
  if (path.startsWith("/collaborator-invitations/"))
    return <GeneratedPageSkeleton page="invitation" />;
  if (path.startsWith("/admin")) return <AdminPageSkeleton path={path} />;
  return (
    <CollectionPageSkeleton
      label="Opening workspace"
      summary={0}
      toolbar={false}
      rows={3}
    />
  );
}
