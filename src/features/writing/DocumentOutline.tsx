import { useMemo, useState } from "react";
import { History, ListTree, RotateCcw, Sparkles } from "lucide-react";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import type { components } from "../../generated/api/schema";

type Revision = components["schemas"]["WritingRevisionResponse"];

/** Trix only produces `<h1>` headings, so those are the outline entries. */
function outlineFromHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return [...parsed.querySelectorAll("h1")].map((heading, index) => ({
    index,
    text: heading.textContent?.trim() || `Untitled section ${index + 1}`,
  }));
}

function scrollToHeading(index: number) {
  const heading = document.querySelectorAll(".writing-trix trix-editor h1")[
    index
  ];
  heading?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
  });
}

function revisionLabel(revision: Revision) {
  return (
    revision.name ??
    revision.reason
      .replaceAll("_", " ")
      .replace(/^\w/, (character) => character.toUpperCase())
  );
}

const time = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Left rail of the editor: jump-to-heading outline over the live document plus
 * the saved revisions, which restore through a confirmation instead of a
 * native `confirm()`.
 */
export function DocumentOutline({
  html,
  revisions,
  onRestore,
}: {
  html: string;
  revisions: Revision[];
  onRestore: (revisionId: string) => Promise<void>;
}) {
  const sections = useMemo(() => outlineFromHtml(html), [html]);
  const [pendingRestore, setPendingRestore] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);

  return (
    <aside className="writing-rail">
      <section className="writing-rail-section">
        <h2>
          <ListTree aria-hidden="true" />
          Outline
        </h2>
        {sections.length ? (
          <>
            <p className="writing-rail-hint">Jump to a heading.</p>
            <nav aria-label="Document outline">
              {sections.map((section) => (
                <button
                  key={section.index}
                  type="button"
                  className="writing-outline-link"
                  onClick={() => scrollToHeading(section.index)}
                >
                  {section.text}
                </button>
              ))}
            </nav>
          </>
        ) : (
          <p className="writing-rail-hint">
            Add headings with the toolbar’s heading button and they appear here
            as jump links.
          </p>
        )}
      </section>

      <section className="writing-rail-section">
        <h2>
          <History aria-hidden="true" />
          Version history
        </h2>
        {revisions.length ? (
          <ul className="writing-revisions">
            {revisions.map((revision) => (
              <li key={revision.id}>
                <div>
                  <span className="writing-revision-name">
                    {revisionLabel(revision)}
                  </span>
                  <span className="writing-revision-meta">
                    v{revision.revision_number} ·{" "}
                    {time.format(new Date(revision.created_at))}
                  </span>
                  {revision.ai_insertions.length ? (
                    <span className="writing-revision-ai">
                      <Sparkles aria-hidden="true" />
                      AI-assisted · {revision.ai_insertions.length} insertion
                      {revision.ai_insertions.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="writing-revision-restore"
                  aria-label={`Restore version ${revision.revision_number}`}
                  onClick={() => setPendingRestore(revision)}
                >
                  <RotateCcw aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="writing-rail-hint">
            Saves and AI edits are versioned here, so you can always go back.
          </p>
        )}
      </section>

      {pendingRestore ? (
        <ConfirmationDialog
          title={`Restore version ${pendingRestore.revision_number}?`}
          confirmLabel="Restore version"
          pendingLabel="Restoring…"
          pending={restoring}
          danger={false}
          onCancel={() => setPendingRestore(null)}
          onConfirm={async () => {
            setRestoring(true);
            try {
              await onRestore(pendingRestore.id);
              setPendingRestore(null);
            } finally {
              setRestoring(false);
            }
          }}
        >
          <p>
            The editor content is replaced with “{revisionLabel(pendingRestore)}
            ” from {time.format(new Date(pendingRestore.created_at))}. Your
            current text is kept as a new version, so this can be undone.
          </p>
        </ConfirmationDialog>
      ) : null}
    </aside>
  );
}
