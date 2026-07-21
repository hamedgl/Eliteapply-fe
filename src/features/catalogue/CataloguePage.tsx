import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Plus, Search, X } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  catalogueApi,
  type CatalogueFilters,
} from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import { PageHeader } from "../../components/page/PageHeader";
import { EmptyState } from "../../components/data-display/EmptyState";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { CountryCombobox } from "../../components/filters/CountryCombobox";
import { countryName } from "../../lib/countries";
import { formatDate } from "../applications/model";
import {
  itemMeta,
  kindLabel,
  kindSingular,
  title,
  type CatalogueItem,
  type Kind,
} from "./model";
import { CatalogueCard } from "./components/CatalogueCard";
import { CatalogueSummary } from "./components/CatalogueSummary";
import { SaveSearchButton } from "./components/SaveSearchButton";
import { ReportIssueDialog } from "./components/ReportIssueDialog";
import "../../styles/workspace.css";
import "./catalogue.css";

type CataloguePageResult = {
  items: CatalogueItem[];
  next_cursor?: string | null;
  has_more: boolean;
  total?: number | null;
};
const KINDS: Kind[] = ["institutions", "programmes", "scholarships"];

function list(
  kind: Kind,
  filters: CatalogueFilters,
  signal?: AbortSignal,
): Promise<CataloguePageResult> {
  if (kind === "institutions")
    return catalogueApi.institutions(filters, signal) as Promise<CataloguePageResult>;
  if (kind === "programmes")
    return catalogueApi.programmes(filters, signal) as Promise<CataloguePageResult>;
  return catalogueApi.scholarships(filters, signal) as Promise<CataloguePageResult>;
}
function detail(kind: Kind, id: string): Promise<CatalogueItem> {
  if (kind === "institutions") return catalogueApi.institution(id);
  if (kind === "programmes") return catalogueApi.programme(id);
  return catalogueApi.scholarship(id);
}

export function CataloguePage() {
  const { kind: routeKind, id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(() => params.get("create") === "1");
  const [reportingTarget, setReportingTarget] = useState<{
    entityType: "institution" | "programme" | "scholarship";
    entityId: string;
    entityTitle: string;
  } | null>(null);
  const kind = (
    KINDS.includes(routeKind as Kind) ? routeKind : params.get("kind") || "institutions"
  ) as Kind;
  const filters = useMemo<CatalogueFilters>(
    () => ({
      search: params.get("search") || undefined,
      country: params.get("country") || undefined,
      degreeLevel: params.get("degreeLevel") || undefined,
      fieldOfStudy: params.get("fieldOfStudy") || undefined,
      verified: params.get("verified") === "true" ? true : undefined,
    }),
    [params],
  );
  const q = useInfiniteQuery({
    queryKey: queryKeys.catalogue(kind, filters),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      list(kind, { ...filters, cursor: pageParam }, signal),
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const items = q.data?.pages.flatMap((page) => page.items) ?? [];

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("kind", kind);
    setParams(next, { replace: true });
  }
  function switchKind(next: Kind) {
    navigate(`/app/catalogue?kind=${next}`);
  }

  if (id) return <CatalogueDetail kind={kind} id={id} />;

  const noFiltersActive = !filters.search && !filters.country && !filters.degreeLevel && !filters.fieldOfStudy && !filters.verified;

  return (
    <div className="page apps-page catalogue-page">
      <PageHeader
        eyebrow="Discovery"
        title="Academic catalogue"
        description="Discover verified institutions, programmes and scholarships, then add the most relevant opportunities to your workspace."
        actions={
          <>
            <Link className="apps-icon-button" to="/app/discovery" aria-label="Saved searches & matches" title="Saved searches & matches">
              <Search aria-hidden="true" />
            </Link>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" /> Add private record
            </button>
          </>
        }
      />

      <CatalogueSummary onSelectKind={switchKind} />

      <nav className="catalogue-tabs" aria-label="Catalogue type">
        {KINDS.map((value) => (
          <button
            key={value}
            type="button"
            className={kind === value ? "selected" : ""}
            aria-pressed={kind === value}
            onClick={() => switchKind(value)}
          >
            {kindLabel[value]}
          </button>
        ))}
      </nav>

      <div className="apps-card apps-toolbar">
        <div className="apps-toolbar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label={`Search ${kind}`}
            value={filters.search ?? ""}
            onChange={(event) => update("search", event.target.value)}
            placeholder={`Search ${kind}`}
          />
          {filters.search ? (
            <button type="button" aria-label="Clear search" onClick={() => update("search", "")}>
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <CountryCombobox
          label="Country"
          value={filters.country ?? ""}
          onChange={(code) => update("country", code)}
        />
        {kind !== "institutions" ? (
          <label className="apps-quick-filter">
            Field of study
            <input
              value={filters.fieldOfStudy ?? ""}
              onChange={(event) => update("fieldOfStudy", event.target.value)}
              placeholder="Any"
            />
          </label>
        ) : null}
        {kind === "programmes" ? (
          <label className="apps-quick-filter">
            Degree level
            <input
              value={filters.degreeLevel ?? ""}
              onChange={(event) => update("degreeLevel", event.target.value)}
              placeholder="Any"
            />
          </label>
        ) : null}
        <label className="check-field catalogue-verified-toggle">
          <input
            type="checkbox"
            checked={filters.verified === true}
            onChange={(event) => update("verified", event.target.checked ? "true" : "")}
          />
          Verified only
        </label>
        <SaveSearchButton kind={kind} filters={filters} />
      </div>

      <p className="catalogue-trust-note">
        Verified records include source evidence and review information. Private
        records are visible only to you and are kept separate from verified
        catalogue data.
      </p>

      {q.isPending ? (
        <div className="apps-skeleton" aria-busy="true" aria-label={`Loading ${kind}`}>
          <div className="apps-skeleton-table">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="skeleton apps-skeleton-row" key={i} />
            ))}
          </div>
        </div>
      ) : q.isError ? (
        <div className="apps-page-error" role="alert">
          <h1>Catalogue unavailable</h1>
          <button className="primary" onClick={() => q.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length ? (
        <div className="catalogue-grid">
          {items.map((item) => (
            <CatalogueCard
              key={item.id}
              kind={kind}
              item={item}
              onReportIssue={(target) =>
                setReportingTarget({
                  entityType: kindSingular[kind] as "institution" | "programme" | "scholarship",
                  entityId: target.id,
                  entityTitle: target.name,
                })
              }
            />
          ))}
        </div>
      ) : noFiltersActive ? (
        <EmptyState
          icon={Search}
          heading={`No ${kind} yet`}
          description="Add a private research record to start building your own catalogue entries."
          primaryAction={{ label: "Add private record", onClick: () => setCreating(true) }}
        />
      ) : (
        <EmptyState
          variant="filtered"
          icon={Search}
          heading={`No ${kind} match these filters`}
          description="Clear a filter, or add a private record if this opportunity isn't catalogued yet."
          primaryAction={{ label: "Clear filters", onClick: () => setParams({ kind }, { replace: true }) }}
        />
      )}

      {q.hasNextPage ? (
        <button className="load-more" type="button" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
          {q.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}

      {creating ? (
        <CatalogueCreateDialog
          kind={kind}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void q.refetch();
          }}
        />
      ) : null}

      {reportingTarget ? (
        <ReportIssueDialog
          open={Boolean(reportingTarget)}
          entityType={reportingTarget.entityType}
          entityId={reportingTarget.entityId}
          entityTitle={reportingTarget.entityTitle}
          onClose={() => setReportingTarget(null)}
        />
      ) : null}
    </div>
  );
}

function CatalogueDetail({ kind, id }: { kind: Kind; id: string }) {
  const user = useSession((state) => state.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const q = useQuery({
    queryKey: queryKeys.catalogueDetail(kind, id),
    queryFn: () => detail(kind, id),
  });
  const remove = useMutation({
    mutationFn: async () => {
      if (kind === "institutions") return catalogueApi.deleteInstitution(id);
      if (kind === "programmes") return catalogueApi.deleteProgramme(id);
      return catalogueApi.deleteScholarship(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["catalogue"] });
      navigate(`/app/catalogue?kind=${kind}`);
    },
  });

  if (q.isPending)
    return (
      <div className="page" role="status">
        Loading catalogue record…
      </div>
    );
  if (q.isError || !q.data)
    return (
      <div className="page error-state">
        <h1>Catalogue record unavailable</h1>
        <Link to="/app/catalogue">Return to catalogue</Link>
      </div>
    );
  const item = q.data;
  const meta = itemMeta(item);
  const editable =
    item.visibility === "private" && (item.created_by_user_id === user?.id || user?.is_admin);
  const provenance = item.source_provenance as Record<string, unknown>;
  const source = "website_url" in item ? item.website_url : "source_url" in item ? item.source_url : null;

  return (
    <div className="page apps-page catalogue-detail">
      <Link className="back" to={`/app/catalogue?kind=${kind}`}>
        <ArrowLeft aria-hidden="true" /> Back to {kindLabel[kind].toLowerCase()}
      </Link>
      <PageHeader
        title={item.name}
        description={
          item.visibility === "canonical"
            ? "Shared catalogue record with source provenance."
            : "Private record visible only within your account."
        }
      />
      <dl className="document-metadata">
        <div>
          <dt>Status</dt>
          <dd>{title(item.visibility)}</dd>
        </div>
        <div>
          <dt>Last verified</dt>
          <dd>
            {item.last_verified_at
              ? formatDate(item.last_verified_at)
              : "No verification information has been added"}
          </dd>
        </div>
        {meta.country_code ? (
          <div>
            <dt>Country</dt>
            <dd>{countryName(meta.country_code)}</dd>
          </div>
        ) : null}
        {kind === "institutions" && meta.institution_type ? (
          <div>
            <dt>Institution type</dt>
            <dd>{title(meta.institution_type)}</dd>
          </div>
        ) : null}
        {kind === "programmes" && meta.duration ? (
          <div>
            <dt>Duration</dt>
            <dd>{meta.duration}</dd>
          </div>
        ) : null}
        {kind === "programmes" && meta.delivery_mode ? (
          <div>
            <dt>Delivery mode</dt>
            <dd>{title(meta.delivery_mode)}</dd>
          </div>
        ) : null}
        {kind === "programmes" && meta.language ? (
          <div>
            <dt>Language</dt>
            <dd>{meta.language}</dd>
          </div>
        ) : null}
        {kind === "programmes" && meta.tuition ? (
          <div>
            <dt>Tuition</dt>
            <dd>{meta.tuition}</dd>
          </div>
        ) : null}
        {kind === "programmes" && meta.intake ? (
          <div>
            <dt>Intake</dt>
            <dd>{meta.intake}</dd>
          </div>
        ) : null}
        {kind === "scholarships" ? (
          <div>
            <dt>Status</dt>
            <dd>{meta.is_open === false ? "Closed" : "Open"}</dd>
          </div>
        ) : null}
        {kind === "scholarships" && meta.deadline_at ? (
          <div>
            <dt>Application deadline</dt>
            <dd>{formatDate(meta.deadline_at)}</dd>
          </div>
        ) : null}
        {kind === "scholarships" && meta.funding_type ? (
          <div>
            <dt>Funding type</dt>
            <dd>{meta.funding_type}</dd>
          </div>
        ) : null}
        {kind === "scholarships" && meta.eligibility ? (
          <div>
            <dt>Eligibility</dt>
            <dd>{meta.eligibility}</dd>
          </div>
        ) : null}
        <div>
          <dt>Provenance</dt>
          <dd>
            {Object.keys(provenance ?? {}).length
              ? Object.entries(provenance).map(([k, v]) => `${title(k)}: ${String(v)}`).join(" · ")
              : "No provenance supplied"}
          </dd>
        </div>
      </dl>
      <div className="document-actions">
        {source ? (
          <a href={source} target="_blank" rel="noreferrer" className="apps-inline-link">
            Open source <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
        <Link
          className="primary"
          to={`/app/applications?create=1&catalogueType=${kindSingular[kind]}&catalogueId=${item.id}&title=${encodeURIComponent(item.name)}`}
        >
          Create application
        </Link>
        {editable ? (
          <>
            <button type="button" onClick={() => setEditing(true)}>
              Edit private record
            </button>
            <button type="button" className="apps-danger-button" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </>
        ) : null}
      </div>
      {!editable && item.visibility === "private" ? (
        <p className="catalogue-detail-note">
          Only the owner or an administrator can edit this private record. Server
          authorization is still authoritative.
        </p>
      ) : null}
      {editing ? (
        <CatalogueEditDialog
          kind={kind}
          item={item}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            qc.setQueryData(queryKeys.catalogueDetail(kind, id), next);
            setEditing(false);
          }}
        />
      ) : null}
      {confirmingDelete ? (
        <ConfirmationDialog
          title={`Delete “${item.name}”?`}
          confirmLabel="Delete record"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => remove.mutate()}
        >
          <p>This permanently removes your private catalogue record. This cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}

function CatalogueCreateDialog({
  kind,
  onClose,
  onCreated,
}: {
  kind: Kind;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const institutions = useQuery({
    queryKey: queryKeys.catalogue("institutions", { surface: "catalogue-create" }),
    queryFn: ({ signal }) => catalogueApi.institutions({}, signal),
    enabled: kind !== "institutions",
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const source = String(data.get("source")) || null;
    const institutionId = String(data.get("institution_id")) || null;
    try {
      if (kind === "institutions")
        await catalogueApi.createInstitution({
          name,
          country_code: countryCode,
          institution_type: String(data.get("institution_type")) || null,
          website_url: source,
          raw_source: {},
        });
      else if (kind === "programmes")
        await catalogueApi.createProgramme({
          institution_id: institutionId!,
          name,
          degree_level: String(data.get("degree_level")) || null,
          field_of_study: String(data.get("field_of_study")) || null,
          duration: String(data.get("duration")) || null,
          delivery_mode: String(data.get("delivery_mode")) || null,
          language: String(data.get("language")) || null,
          tuition: String(data.get("tuition")) || null,
          intake: String(data.get("intake")) || null,
          source_url: source,
          raw_source: {},
        });
      else
        await catalogueApi.createScholarship({
          institution_id: institutionId,
          name,
          provider_name: String(data.get("provider_name")) || null,
          award_summary: String(data.get("award_summary")) || null,
          deadline_at: data.get("deadline_at")
            ? new Date(`${String(data.get("deadline_at"))}T12:00:00Z`).toISOString()
            : null,
          funding_type: String(data.get("funding_type")) || null,
          eligibility: String(data.get("eligibility")) || null,
          is_open: data.get("is_open") === "on",
          source_url: source,
          raw_source: {},
        });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Record could not be created.");
    }
  }
  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section className="apps-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogue-create-title">
        <header>
          <div>
            <h2 id="catalogue-create-title">Add private {kindSingular[kind]}</h2>
            <p>This record stays private and is never shown as verified.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">
            Name
            <input name="name" required minLength={2} autoFocus />
          </label>
          {kind === "institutions" ? (
            <>
              <div className="wide">
                <CountryCombobox label="Country" value={countryCode} onChange={setCountryCode} />
              </div>
              <label>
                Institution type
                <input name="institution_type" placeholder="University, college…" />
              </label>
            </>
          ) : (
            <label className="wide">
              Institution {kind === "scholarships" ? "(optional)" : ""}
              <select name="institution_id" required={kind === "programmes"} disabled={institutions.isPending}>
                <option value="">
                  {institutions.isPending
                    ? "Loading institutions…"
                    : kind === "programmes"
                      ? "Select an institution"
                      : "No institution"}
                </option>
                {institutions.data?.items.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
              {!institutions.isPending && !institutions.data?.items.length ? (
                <small>
                  <Link to="/app/catalogue?kind=institutions&create=1">Add a private institution first</Link>
                </small>
              ) : null}
            </label>
          )}
          {kind === "programmes" ? (
            <>
              <label>
                Degree level
                <input name="degree_level" />
              </label>
              <label>
                Field of study
                <input name="field_of_study" />
              </label>
              <label>
                Duration
                <input name="duration" placeholder="2 years" />
              </label>
              <label>
                Delivery mode
                <input name="delivery_mode" placeholder="On campus, online, hybrid…" />
              </label>
              <label>
                Language
                <input name="language" placeholder="English" />
              </label>
              <label>
                Tuition
                <input name="tuition" placeholder="£12,000/year" />
              </label>
              <label>
                Intake
                <input name="intake" placeholder="Autumn 2027" />
              </label>
            </>
          ) : null}
          {kind === "scholarships" ? (
            <>
              <label>
                Provider
                <input name="provider_name" />
              </label>
              <label>
                Funding type
                <input name="funding_type" placeholder="Full tuition, partial, stipend…" />
              </label>
              <label>
                Application deadline
                <input name="deadline_at" type="date" />
              </label>
              <label className="check-field">
                <input name="is_open" type="checkbox" defaultChecked /> Currently open
              </label>
              <label className="wide">
                Award summary
                <textarea name="award_summary" rows={3} />
              </label>
              <label className="wide">
                Eligibility
                <textarea name="eligibility" rows={3} />
              </label>
            </>
          ) : null}
          <label className="wide">
            Source URL
            <input name="source" type="url" />
          </label>
          {error ? (
            <p className="form-error wide" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={kind === "institutions" && !countryCode}>
              Create private record
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CatalogueEditDialog({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: Kind;
  item: CatalogueItem;
  onClose: () => void;
  onSaved: (item: CatalogueItem) => void;
}) {
  const meta = itemMeta(item);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    if (kind === "institutions")
      onSaved(
        await catalogueApi.updateInstitution(item.id, {
          name,
          institution_type: String(data.get("institution_type")) || null,
        }),
      );
    else if (kind === "programmes")
      onSaved(
        await catalogueApi.updateProgramme(item.id, {
          name,
          degree_level: String(data.get("degree_level")) || null,
          field_of_study: String(data.get("field_of_study")) || null,
          duration: String(data.get("duration")) || null,
          delivery_mode: String(data.get("delivery_mode")) || null,
          language: String(data.get("language")) || null,
          tuition: String(data.get("tuition")) || null,
          intake: String(data.get("intake")) || null,
        }),
      );
    else
      onSaved(
        await catalogueApi.updateScholarship(item.id, {
          name,
          provider_name: String(data.get("provider_name")) || null,
          award_summary: String(data.get("award_summary")) || null,
          deadline_at: data.get("deadline_at")
            ? new Date(`${String(data.get("deadline_at"))}T12:00:00Z`).toISOString()
            : null,
          funding_type: String(data.get("funding_type")) || null,
          eligibility: String(data.get("eligibility")) || null,
          is_open: data.get("is_open") === "on",
        }),
      );
  }
  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section className="apps-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogue-edit-title">
        <header>
          <h2 id="catalogue-edit-title">Edit private {kindSingular[kind]}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">
            Name
            <input name="name" required defaultValue={item.name} autoFocus />
          </label>
          {kind === "institutions" ? (
            <label>
              Institution type
              <input name="institution_type" defaultValue={meta.institution_type ?? ""} placeholder="University, college…" />
            </label>
          ) : null}
          {kind === "programmes" ? (
            <>
              <label>
                Degree level
                <input name="degree_level" defaultValue={meta.degree_level ?? ""} />
              </label>
              <label>
                Field of study
                <input name="field_of_study" defaultValue={meta.field_of_study ?? ""} />
              </label>
              <label>
                Duration
                <input name="duration" defaultValue={meta.duration ?? ""} placeholder="2 years" />
              </label>
              <label>
                Delivery mode
                <input name="delivery_mode" defaultValue={meta.delivery_mode ?? ""} placeholder="On campus, online, hybrid…" />
              </label>
              <label>
                Language
                <input name="language" defaultValue={meta.language ?? ""} placeholder="English" />
              </label>
              <label>
                Tuition
                <input name="tuition" defaultValue={meta.tuition ?? ""} placeholder="£12,000/year" />
              </label>
              <label>
                Intake
                <input name="intake" defaultValue={meta.intake ?? ""} placeholder="Autumn 2027" />
              </label>
            </>
          ) : null}
          {kind === "scholarships" ? (
            <>
              <label>
                Provider
                <input name="provider_name" defaultValue={meta.provider_name ?? ""} />
              </label>
              <label>
                Funding type
                <input name="funding_type" defaultValue={meta.funding_type ?? ""} placeholder="Full tuition, partial, stipend…" />
              </label>
              <label>
                Application deadline
                <input name="deadline_at" type="date" defaultValue={meta.deadline_at ? meta.deadline_at.slice(0, 10) : ""} />
              </label>
              <label className="check-field">
                <input name="is_open" type="checkbox" defaultChecked={meta.is_open !== false} /> Currently open
              </label>
              <label className="wide">
                Award summary
                <textarea name="award_summary" defaultValue={meta.award_summary ?? ""} rows={3} />
              </label>
              <label className="wide">
                Eligibility
                <textarea name="eligibility" defaultValue={meta.eligibility ?? ""} rows={3} />
              </label>
            </>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary">Save changes</button>
          </div>
        </form>
      </section>
    </div>
  );
}
