import { SampleBadge } from "../../components/data-display/SampleBadge";
import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Copy,
  FileText,
  FilePlus2,
  Link2,
  Search,
  Unlink,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { writingApi } from "../../lib/api/phase3";
import { applicationsApi } from "../../lib/api/phase2";
import { EntityCombobox } from "../../components/filters/EntityCombobox";
import { queryKeys } from "../../lib/api/queryKeys";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import { NewWritingDialog } from "./NewWritingDialog";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { PageRefreshButton } from "../../components/page/PageHeader";
import { WritingLibraryPageSkeleton } from "../../components/page/PageSkeleton";
import { WorkspacePageGuideButton } from "../../components/AppShell";
import { contentToHtml, countText, label } from "./documentHtml";
import type { components } from "../../generated/api/schema";
type S = components["schemas"];

export function WritingLibrary({
  openCreate = false,
}: {
  openCreate?: boolean;
}) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [creating, setCreating] = useState(openCreate);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [linking, setLinking] = useState<S["WritingDocumentResponse"] | null>(
    null,
  );
  const q = useInfiniteQuery({
    queryKey: ["writing", "list", { includeArchived }],
    queryFn: ({ pageParam }) =>
      writingApi.list(undefined, includeArchived, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  // Decoupled from the paginated query above: the summary counts and the
  // type/application filter dropdowns need to reflect more than whatever
  // pages happen to be loaded so far.
  const statsQuery = useQuery({
    queryKey: ["writing", "stats", { includeArchived }],
    queryFn: () => writingApi.list(undefined, includeArchived, undefined, 100),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["writing"] });
  const archive = useMutation({
    mutationFn: (document: S["WritingDocumentResponse"]) =>
      writingApi.update(document.id, {
        expected_version: document.version,
        status: document.status === "archived" ? "draft" : "archived",
      }),
    onSuccess: refresh,
  });
  const duplicate = useMutation({
    mutationFn: (document: S["WritingDocumentResponse"]) =>
      writingApi.duplicate(document.id, {
        title_suffix: " (copy)",
        keep_application_link: true,
      }),
    onSuccess: (document) => {
      void refresh();
      nav(`/app/writing/${document.id}`);
    },
  });
  const unlink = useMutation({
    mutationFn: (document: S["WritingDocumentResponse"]) =>
      writingApi.detach(document.id, document.application_id!),
    onSuccess: refresh,
  });
  const documents = useMemo(
    () => q.data?.pages.flatMap((page) => page.items) ?? [],
    [q.data],
  );
  const statsDocuments = statsQuery.data?.items ?? [];
  const applications = useMemo(
    () =>
      Array.from(
        new Map(
          statsDocuments
            .filter((document) => document.application_id)
            .map((document) => [
              document.application_id!,
              document.application_title ?? "Linked application",
            ]),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [statsDocuments],
  );
  const documentTypes = useMemo(
    () =>
      [...new Set(statsDocuments.map((document) => document.document_type))].sort(),
    [statsDocuments],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return documents
      .filter(
        (document) =>
          (!term ||
            `${document.title} ${document.document_type} ${document.application_title ?? ""}`
              .toLocaleLowerCase()
              .includes(term)) &&
          (statusFilter === "all" || document.status === statusFilter) &&
          (typeFilter === "all" || document.document_type === typeFilter) &&
          (applicationFilter === "all" ||
            (applicationFilter === "unlinked"
              ? !document.application_id
              : document.application_id === applicationFilter)),
      )
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "oldest"
            ? Date.parse(a.updated_at) - Date.parse(b.updated_at)
            : Date.parse(b.updated_at) - Date.parse(a.updated_at),
      );
  }, [applicationFilter, documents, search, sort, statusFilter, typeFilter]);
  const hasFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    applicationFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setApplicationFilter("all");
  };
  const actionPending =
    archive.isPending || duplicate.isPending || unlink.isPending;
  if (q.isPending || statsQuery.isPending)
    return <WritingLibraryPageSkeleton createOpen={openCreate} />;
  return (
    <div className="page writing-library">
      <header className="page-heading">
        <div>
          <h1>Writing Studio</h1>
          <p>
            Create, refine and export application writing grounded in your
            evidence.
          </p>
        </div>
        <div className="apps-header-actions">
          <PageRefreshButton
            onRefresh={() => void Promise.all([q.refetch(), statsQuery.refetch()])}
            refreshing={q.isFetching || statsQuery.isFetching}
          />
          <WorkspacePageGuideButton />
          <button
            type="button"
            className="primary"
            onClick={() => setCreating(true)}
          >
            <FilePlus2 aria-hidden="true" />
            New document
          </button>
        </div>
      </header>
      {!q.isError && statsDocuments.length ? (
        <section className="writing-summary" aria-label="Document summary">
          <div>
            <strong>{statsDocuments.length}</strong>
            <span>{includeArchived ? "Documents" : "Active documents"}</span>
          </div>
          <div>
            <strong>
              {
                statsDocuments.filter((document) => document.status === "draft")
                  .length
              }
            </strong>
            <span>Drafts in progress</span>
          </div>
          <div>
            <strong>
              {statsDocuments.filter((document) => document.application_id).length}
            </strong>
            <span>Linked to applications</span>
          </div>
          <div>
            <strong>
              {
                statsDocuments.filter((document) =>
                  ["review", "final"].includes(document.status),
                ).length
              }
            </strong>
            <span>In review or final</span>
          </div>
        </section>
      ) : null}
      <section className="writing-toolbar" aria-label="Filter documents">
        <label className="writing-search">
          <span>Search documents</span>
          <div>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, type or application"
            />
          </div>
        </label>
        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In review</option>
            <option value="final">Final</option>
            {includeArchived ? (
              <option value="archived">Archived</option>
            ) : null}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All document types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {label(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Application</span>
          <select
            value={applicationFilter}
            onChange={(event) => setApplicationFilter(event.target.value)}
          >
            <option value="all">All applications</option>
            <option value="unlinked">Not linked</option>
            {applications.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="oldest">Oldest updated</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
        <label className="writing-archive-filter">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => {
              setIncludeArchived(event.target.checked);
              if (!event.target.checked && statusFilter === "archived")
                setStatusFilter("all");
            }}
          />
          Show archived
        </label>
      </section>
      {q.isError ? (
        <div className="vault-empty writing-error-state">
          <AlertTriangle aria-hidden="true" />
          <h2>Documents could not be loaded</h2>
          <p>
            Check your connection and try again. Your saved work is unchanged.
          </p>
          <button type="button" onClick={() => void q.refetch()}>
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <>
          <div className="writing-results-heading">
            <p>
              Showing <strong>{filtered.length}</strong> of {documents.length}{" "}
              document{documents.length === 1 ? "" : "s"}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="writing-document-grid">
            {filtered.map((document) => {
              const words = countText(contentToHtml(document.content)).words;
              return (
                <article
                  className={`writing-card${document.status === "archived" ? " is-archived" : ""}`}
                  key={document.id}
                >
                  <header>
                    <span className="writing-card-icon">
                      <FileText aria-hidden="true" />
                    </span>
                    <div>
                      <StatusBadge
                        tone={
                          document.status === "final"
                            ? "green"
                            : document.status === "review"
                              ? "amber"
                              : document.status === "archived"
                                ? "grey"
                                : "blue"
                        }
                      >
                        {document.status === "review"
                          ? "In review"
                          : label(document.status)}
                      </StatusBadge>
                      <span className="writing-card-type">
                        {label(document.document_type)}
                      </span>
                    </div>
                    <OverflowMenu
                      label={`More actions for ${document.title}`}
                      items={[
                        {
                          key: "duplicate",
                          label: "Duplicate",
                          icon: Copy,
                          disabled: actionPending,
                          onClick: () => duplicate.mutate(document),
                        },
                        {
                          key: "application",
                          label: document.application_id
                            ? "Change application"
                            : "Link application",
                          icon: Link2,
                          disabled: actionPending,
                          onClick: () => setLinking(document),
                        },
                        ...(document.application_id
                          ? [
                              {
                                key: "unlink",
                                label: "Remove application link",
                                icon: Unlink,
                                disabled: actionPending,
                                onClick: () => unlink.mutate(document),
                              } as const,
                            ]
                          : []),
                        { key: "divider", divider: true },
                        {
                          key: "archive",
                          label:
                            document.status === "archived"
                              ? "Restore"
                              : "Archive",
                          icon:
                            document.status === "archived"
                              ? ArchiveRestore
                              : Archive,
                          disabled: actionPending,
                          onClick: () => archive.mutate(document),
                        },
                      ]}
                    />
                  </header>
                  <div className="writing-card-body">
                    <Link
                      className="writing-card-title"
                      to={`/app/writing/${document.id}`}
                    >
                      {document.title}
                    </Link>
                    <SampleBadge isSample={document.is_sample} />
                    <p className="writing-card-meta">
                      {words.toLocaleString()} word{words === 1 ? "" : "s"}
                      <span aria-hidden="true">·</span>
                      Updated{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                      }).format(new Date(document.updated_at))}
                    </p>
                    {document.application_id ? (
                      <Link
                        className="writing-application-link"
                        to={`/app/applications/${document.application_id}`}
                      >
                        <Link2 aria-hidden="true" />
                        <span>
                          <strong>
                            {document.application_title ?? "Linked application"}
                          </strong>
                          {document.application_stage
                            ? label(document.application_stage)
                            : "Application"}
                        </span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="writing-application-link is-empty"
                        onClick={() => setLinking(document)}
                      >
                        <Link2 aria-hidden="true" />
                        <span>
                          <strong>Link an application</strong>
                          Ground this document in its destination
                        </span>
                      </button>
                    )}
                  </div>
                  <footer>
                    <Link
                      className="primary writing-continue"
                      to={`/app/writing/${document.id}`}
                    >
                      {document.status === "archived"
                        ? "View document"
                        : "Continue writing"}
                    </Link>
                    {document.word_limit ? (
                      <span>
                        {words}/{document.word_limit.toLocaleString()} words
                      </span>
                    ) : (
                      <span>No word limit</span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
          {q.hasNextPage ? (
            <button
              className="load-more"
              type="button"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
            >
              {q.isFetchingNextPage ? "Loading…" : "Load more documents"}
            </button>
          ) : null}
        </>
      ) : documents.length ? (
        <div className="vault-empty writing-filter-empty">
          <Search aria-hidden="true" />
          <h2>No documents match these filters</h2>
          <p>
            {q.hasNextPage
              ? "Try a different search, status, type or application — or load more documents, since these filters only search what's loaded so far."
              : "Try a different search, status, type or application."}
          </p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
          {q.hasNextPage ? (
            <button
              className="load-more"
              type="button"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
            >
              {q.isFetchingNextPage ? "Loading…" : "Load more documents"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="vault-empty">
          <FilePlus2 aria-hidden="true" />
          <h2>No writing documents yet</h2>
          <p>Start with a statement, essay, study plan or academic CV.</p>
          <button
            type="button"
            className="primary"
            onClick={() => setCreating(true)}
          >
            Create your first document
          </button>
        </div>
      )}
      {archive.isError || duplicate.isError || unlink.isError ? (
        <p className="form-error" role="alert">
          That document action could not be completed. Refresh and try again.
        </p>
      ) : null}
      {creating ? (
        <NewWritingDialog onClose={() => setCreating(false)} />
      ) : null}
      {linking ? (
        <WritingApplicationDialog
          key={`${linking.id}:${linking.application_id ?? ""}`}
          document={linking}
          onClose={() => setLinking(null)}
          onLinked={() => {
            setLinking(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function WritingApplicationDialog({
  document,
  onClose,
  onLinked,
}: {
  document: S["WritingDocumentResponse"];
  onClose: () => void;
  onLinked: () => void;
}) {
  const [application, setApplication] = useState({
    id: document.application_id ?? "",
    name: document.application_title ?? "",
  });
  const linkApplication = useMutation({
    mutationFn: () => writingApi.attach(document.id, application.id),
    onSuccess: onLinked,
  });
  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-dialog writing-link-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="writing-link-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div>
            <h2 id="writing-link-title">
              {document.application_id
                ? "Change linked application"
                : "Link to an application"}
            </h2>
            <p className="apps-dialog-subtext">
              Connect “{document.title}” so its context appears throughout your
              application workspace.
            </p>
          </div>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              onClose();
            }}
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          className="apps-dialog-body"
          onSubmit={(event) => {
            event.preventDefault();
            linkApplication.mutate();
          }}
        >
          <EntityCombobox
            queryKey={queryKeys.applications}
            search={async (search) =>
              (
                await applicationsApi.list({
                  search,
                  limit: 10,
                })
              ).items.map((application) => ({
                id: application.id,
                name: application.title,
                hint: label(application.stage),
              }))
            }
            label="Application"
            placeholder="Search your applications…"
            value={application.id}
            valueLabel={application.name}
            onChange={(id, name) => setApplication({ id, name })}
          />
          {linkApplication.isError ? (
            <p className="form-error" role="alert">
              This document could not be linked. Try again.
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                onClose();
              }}
              onClick={onClose}
              disabled={linkApplication.isPending}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={
                !application.id ||
                application.id === document.application_id ||
                linkApplication.isPending
              }
            >
              {linkApplication.isPending
                ? "Saving…"
                : document.application_id
                  ? "Change application"
                  : "Link application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
/** `/app/writing/new` predates the modal; it now opens the same dialog over the library. */
export function NewWriting() {
  return <WritingLibrary openCreate />;
}
