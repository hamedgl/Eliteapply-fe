import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { components } from "../../generated/api/schema";
import {
  catalogueApi,
  discoveryApi,
  type CatalogueFilters,
} from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";

type S = components["schemas"];
type Kind = "institutions" | "programmes" | "scholarships";
type Item =
  | S["InstitutionResponse"]
  | S["ProgrammeResponse"]
  | S["ScholarshipResponse"];
type CataloguePageResult = {
  items: Item[];
  next_cursor?: string | null;
  has_more: boolean;
  total?: number | null;
};
const singular = {
  institutions: "institution",
  programmes: "programme",
  scholarships: "scholarship",
} as const;
const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());

function list(
  kind: Kind,
  filters: CatalogueFilters,
  signal?: AbortSignal,
): Promise<CataloguePageResult> {
  if (kind === "institutions")
    return catalogueApi.institutions(
      filters,
      signal,
    ) as Promise<CataloguePageResult>;
  if (kind === "programmes")
    return catalogueApi.programmes(
      filters,
      signal,
    ) as Promise<CataloguePageResult>;
  return catalogueApi.scholarships(
    filters,
    signal,
  ) as Promise<CataloguePageResult>;
}
function detail(kind: Kind, id: string): Promise<Item> {
  if (kind === "institutions")
    return catalogueApi.institution(id) as Promise<Item>;
  if (kind === "programmes") return catalogueApi.programme(id) as Promise<Item>;
  return catalogueApi.scholarship(id) as Promise<Item>;
}

export function CataloguePage() {
  const { kind: routeKind, id } = useParams(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams(),
    [creating, setCreating] = useState(() => params.get("create") === "1"),
    kind = (
      ["institutions", "programmes", "scholarships"].includes(routeKind ?? "")
        ? routeKind
        : params.get("kind") || "institutions"
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
    value ? next.set(key, value) : next.delete(key);
    next.set("kind", kind);
    setParams(next, { replace: true });
  }
  if (id) return <CatalogueDetail kind={kind} id={id} />;
  return (
    <div className="page catalogue-page phase2-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Discovery</span>
          <h1>Academic catalogue</h1>
          <p>
            Compare trusted catalogue records with your private research,
            without confusing the two.
          </p>
        </div>
        <div className="page-heading-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={() => setCreating(true)}
          >
            Add private record
          </button>
          <Link className="secondary-action" to="/app/discovery">
            Saved searches & matches
          </Link>
        </div>
      </header>
      <nav className="tabs" aria-label="Catalogue type">
        {(Object.keys(singular) as Kind[]).map((value) => (
          <button
            key={value}
            className={kind === value ? "active" : ""}
            onClick={() => navigate(`/app/catalogue?kind=${value}`)}
          >
            {title(value)}
          </button>
        ))}
      </nav>
      <section className="catalogue-controls" aria-label="Catalogue filters">
        <label className="search-field">
          <Search aria-hidden="true" />
          Search
          <input
            value={filters.search ?? ""}
            onChange={(e) => update("search", e.target.value)}
            placeholder={`Search ${kind}`}
          />
        </label>
        <label>
          Country code
          <input
            value={filters.country ?? ""}
            onChange={(e) =>
              update("country", e.target.value.toUpperCase().slice(0, 2))
            }
            maxLength={2}
            placeholder="GB"
          />
        </label>
        {kind !== "institutions" ? (
          <>
            <label>
              Field
              <input
                value={filters.fieldOfStudy ?? ""}
                onChange={(e) => update("fieldOfStudy", e.target.value)}
              />
            </label>
            <label>
              Degree level
              <input
                value={filters.degreeLevel ?? ""}
                onChange={(e) => update("degreeLevel", e.target.value)}
                disabled={kind === "scholarships"}
              />
            </label>
          </>
        ) : null}
        <label className="check-field">
          <input
            type="checkbox"
            checked={filters.verified === true}
            onChange={(e) => update("verified", e.target.checked ? "true" : "")}
          />
          Verified sources only
        </label>
        <SaveSearch kind={kind} filters={filters} />
      </section>
      {q.isPending ? (
        <p role="status">Loading catalogue…</p>
      ) : q.isError ? (
        <div className="inline-error" role="alert">
          <strong>Catalogue unavailable</strong>
          <button onClick={() => q.refetch()}>Try again</button>
        </div>
      ) : items.length ? (
        <div className="catalogue-table" role="list">
          {items.map((item) => (
            <CatalogueRow key={item.id} kind={kind} item={item} />
          ))}
        </div>
      ) : (
        <div className="vault-empty">
          <h2>No matching {kind}</h2>
          <p>
            Adjust a filter or save this search and return when new records are
            added.
          </p>
        </div>
      )}
      {q.hasNextPage ? (
        <button
          className="load-more"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
        >
          {q.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
      <p className="catalogue-disclaimer">
        Private entries are personal research records. Only canonical records
        with source evidence should be treated as shared catalogue data.
      </p>
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
    </div>
  );
}

function CatalogueRow({ kind, item }: { kind: Kind; item: Item }) {
  const meta = item as Item & {
    country_code?: string;
    degree_level?: string | null;
    field_of_study?: string | null;
    provider_name?: string | null;
  };
  return (
    <article role="listitem" className="catalogue-row">
      <div>
        <span className={`visibility-badge ${item.visibility}`}>
          {item.visibility === "canonical" ? "Canonical" : "Private"}
        </span>
        <h2>
          <Link to={`/app/catalogue/${kind}/${item.id}`}>{item.name}</Link>
        </h2>
        <p>
          {[
            meta.country_code,
            meta.provider_name,
            meta.degree_level,
            meta.field_of_study,
          ]
            .filter(Boolean)
            .join(" · ") || "Details available in the record"}
        </p>
      </div>
      <div className="catalogue-verified">
        <span>
          {item.last_verified_at
            ? `Checked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.last_verified_at))}`
            : "Verification date unavailable"}
        </span>
        <Link to={`/app/catalogue/${kind}/${item.id}`}>View details</Link>
      </div>
    </article>
  );
}

function SaveSearch({
  kind,
  filters,
}: {
  kind: Kind;
  filters: CatalogueFilters;
}) {
  const qc = useQueryClient(),
    [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      discoveryApi.createSavedSearch({
        name: `${title(singular[kind])} search`,
        entity_type: singular[kind],
        filters: {
          search: filters.search,
          country: filters.country,
          degree_level: filters.degreeLevel,
          field_of_study: filters.fieldOfStudy,
          verified: filters.verified,
        },
      }),
    onSuccess: () => {
      setSaved(true);
      void qc.invalidateQueries({ queryKey: queryKeys.savedSearches });
    },
  });
  return (
    <button
      className="secondary-action"
      type="button"
      disabled={mutation.isPending || saved}
      onClick={() => mutation.mutate()}
    >
      {saved ? "Search saved" : "Save current search"}
    </button>
  );
}

function CatalogueDetail({ kind, id }: { kind: Kind; id: string }) {
  const user = useSession((x) => x.user),
    navigate = useNavigate(),
    qc = useQueryClient(),
    [editing, setEditing] = useState(false),
    q = useQuery({
      queryKey: queryKeys.catalogueDetail(kind, id),
      queryFn: () => detail(kind, id),
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
  const item = q.data,
    editable =
      item.visibility === "private" &&
      (item.created_by_user_id === user?.id || user?.is_admin);
  const provenance = item.source_provenance as Record<string, unknown>;
  const source =
    "website_url" in item
      ? item.website_url
      : "source_url" in item
        ? item.source_url
        : null;
  return (
    <div className="page phase2-page catalogue-detail">
      <Link className="back" to={`/app/catalogue?kind=${kind}`}>
        <ArrowLeft />
        Back to {kind}
      </Link>
      <header>
        <span className={`visibility-badge ${item.visibility}`}>
          {title(item.visibility)}
        </span>
        <h1>{item.name}</h1>
        <p>
          {item.visibility === "canonical"
            ? "Shared catalogue record with source provenance."
            : "Private record visible only within your account."}
        </p>
      </header>
      <dl className="detail-list">
        <div>
          <dt>Last verified</dt>
          <dd>
            {item.last_verified_at
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: "long",
                }).format(new Date(item.last_verified_at))
              : "Not yet verified"}
          </dd>
        </div>
        <div>
          <dt>Provenance</dt>
          <dd>
            {Object.keys(provenance).length
              ? Object.entries(provenance)
                  .map(([k, v]) => `${title(k)}: ${String(v)}`)
                  .join(" · ")
              : "No provenance supplied"}
          </dd>
        </div>
      </dl>
      <div className="detail-actions">
        {source ? (
          <a href={source} target="_blank" rel="noreferrer">
            Open source <ExternalLink />
          </a>
        ) : null}
        <Link
          className="primary"
          to={`/app/applications?create=1&catalogueType=${singular[kind]}&catalogueId=${item.id}&title=${encodeURIComponent(item.name)}`}
        >
          Create application
        </Link>
        {editable ? (
          <>
            <button type="button" onClick={() => setEditing(true)}>
              Edit private record
            </button>
            <button
              className="danger-link"
              type="button"
              onClick={async () => {
                if (!confirm("Delete this private catalogue record?")) return;
                if (kind === "institutions")
                  await catalogueApi.deleteInstitution(id);
                else if (kind === "programmes")
                  await catalogueApi.deleteProgramme(id);
                else await catalogueApi.deleteScholarship(id);
                await qc.invalidateQueries({ queryKey: ["catalogue"] });
                navigate(`/app/catalogue?kind=${kind}`);
              }}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
      {!editable && item.visibility === "private" ? (
        <p className="muted">
          Only the owner or an administrator can edit this private record.
          Server authorization is still authoritative.
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
  const institutions = useQuery({
    queryKey: queryKeys.catalogue("institutions", {
      surface: "catalogue-create",
    }),
    queryFn: ({ signal }) => catalogueApi.institutions({}, signal),
    enabled: kind !== "institutions",
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      name = String(data.get("name")),
      source = String(data.get("source")) || null,
      institutionId = String(data.get("institution_id")) || null;
    try {
      if (kind === "institutions")
        await catalogueApi.createInstitution({
          name,
          country_code: String(data.get("country_code")).toUpperCase(),
          website_url: source,
          raw_source: {},
        });
      else if (kind === "programmes")
        await catalogueApi.createProgramme({
          institution_id: institutionId!,
          name,
          degree_level: String(data.get("degree_level")) || null,
          field_of_study: String(data.get("field_of_study")) || null,
          source_url: source,
          raw_source: {},
        });
      else
        await catalogueApi.createScholarship({
          institution_id: institutionId,
          name,
          provider_name: String(data.get("provider_name")) || null,
          award_summary: String(data.get("award_summary")) || null,
          source_url: source,
          raw_source: {},
        });
      onCreated();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Record could not be created.",
      );
    }
  }
  return (
    <div className="dialog-backdrop">
      <form className="dialog settings-form" onSubmit={submit}>
        <header>
          <div>
            <h2>Add private {singular[kind]}</h2>
            <p>This record stays private and is not represented as verified.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <label>Name<input name="name" required minLength={2} /></label>
        {kind === "institutions" ? (
          <label>Country code<input name="country_code" required minLength={2} maxLength={2} /></label>
        ) : (
          <label>
            Institution {kind === "scholarships" ? "(optional)" : ""}
            <select
              name="institution_id"
              required={kind === "programmes"}
              disabled={institutions.isPending}
            >
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
                <Link to="/app/catalogue?kind=institutions&create=1">
                  Add a private institution first
                </Link>
              </small>
            ) : null}
          </label>
        )}
        {kind === "programmes" ? <><label>Degree level<input name="degree_level" /></label><label>Field of study<input name="field_of_study" /></label></> : null}
        {kind === "scholarships" ? <><label>Provider<input name="provider_name" /></label><label>Award summary<textarea name="award_summary" rows={4} /></label></> : null}
        <label>Source URL<input name="source" type="url" /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary">Create private record</button></div>
      </form>
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
  item: Item;
  onClose: () => void;
  onSaved: (item: Item) => void;
}) {
  const meta = item as Item & {
    degree_level?: string | null;
    field_of_study?: string | null;
    provider_name?: string | null;
    award_summary?: string | null;
  };
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      name = String(data.get("name"));
    if (kind === "institutions")
      onSaved(await catalogueApi.updateInstitution(item.id, { name }));
    else if (kind === "programmes")
      onSaved(
        await catalogueApi.updateProgramme(item.id, {
          name,
          degree_level: String(data.get("degree_level")) || null,
          field_of_study: String(data.get("field_of_study")) || null,
        }),
      );
    else
      onSaved(
        await catalogueApi.updateScholarship(item.id, {
          name,
          provider_name: String(data.get("provider_name")) || null,
          award_summary: String(data.get("award_summary")) || null,
        }),
      );
  }
  return (
    <div className="dialog-backdrop">
      <form className="dialog settings-form" onSubmit={submit}>
        <header><h2>Edit private {singular[kind]}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        <label>Name<input name="name" required defaultValue={item.name} /></label>
        {kind === "programmes" ? <><label>Degree level<input name="degree_level" defaultValue={meta.degree_level ?? ""} /></label><label>Field of study<input name="field_of_study" defaultValue={meta.field_of_study ?? ""} /></label></> : null}
        {kind === "scholarships" ? <><label>Provider<input name="provider_name" defaultValue={meta.provider_name ?? ""} /></label><label>Award summary<textarea name="award_summary" defaultValue={meta.award_summary ?? ""} /></label></> : null}
        <div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary">Save changes</button></div>
      </form>
    </div>
  );
}
