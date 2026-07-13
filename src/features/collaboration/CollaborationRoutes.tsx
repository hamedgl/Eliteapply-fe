import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { collaborationApi, publicShareApi } from "../../lib/api/phase3";
import { useSession } from "../../lib/auth/session";
import { previewDocument } from "../../lib/safeHtml";

const invitationKey = "eliteapply.collaborator-invitation";

export function AcceptCollaboratorInvitation() {
  const { token } = useParams(),
    authenticated = Boolean(useSession((x) => x.accessToken));
  useEffect(() => {
    if (token && !authenticated) sessionStorage.setItem(invitationKey, token);
  }, [token, authenticated]);
  if (!authenticated)
    return (
      <Navigate
        to="/login?returnTo=%2Fcollaborator-invitations%2Faccept"
        replace
      />
    );
  return (
    <AcceptStoredInvitation
      token={token || sessionStorage.getItem(invitationKey) || ""}
    />
  );
}

function AcceptStoredInvitation({ token }: { token: string }) {
  const navigate = useNavigate(),
    [state, setState] = useState("Accepting invitation…");
  useEffect(() => {
    if (!token) {
      setState("This invitation is missing or has expired.");
      return;
    }
    collaborationApi
      .accept(token)
      .then((result) => {
        sessionStorage.removeItem(invitationKey);
        setState("Invitation accepted. Opening the application…");
        navigate(`/app/applications/${result.application_id}`, {
          replace: true,
        });
      })
      .catch(() =>
        setState(
          "This invitation could not be accepted. It may be expired or already used.",
        ),
      );
  }, [navigate, token]);
  return (
    <main className="public-state" role="status">
      <span className="app-brand">
        <span aria-hidden="true">E</span>EliteApply
      </span>
      <h1>Collaborator invitation</h1>
      <p>{state}</p>
    </main>
  );
}

export function SharedWritingPage() {
  const { token = "" } = useParams(),
    [passcode, setPasscode] = useState(""),
    [document, setDocument] = useState<Awaited<
      ReturnType<typeof publicShareApi.get>
    > | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const robots = window.document.head.querySelector<HTMLMetaElement>(
        'meta[name="robots"]',
      ),
      previous = robots?.content;
    if (robots) robots.content = "noindex,nofollow";
    return () => {
      if (robots && previous) robots.content = previous;
    };
  }, []);
  async function load(code?: string) {
    setError("");
    try {
      setDocument(await publicShareApi.get(token, code));
    } catch {
      setError(
        "Enter the share passcode, or ask the owner for a current link.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, [token]);
  return (
    <main className="shared-writing">
      <header>
        <span className="app-brand">
          <span aria-hidden="true">E</span>EliteApply
        </span>
        <p>Secure writing review</p>
      </header>
      {document ? (
        <>
          <section className="shared-title">
            <span>
              {document.scope === "comment" ? "Comments enabled" : "View only"}
            </span>
            <h1>{document.title}</h1>
            <p>
              {document.word_count} words · {document.character_count}{" "}
              characters
            </p>
          </section>
          <iframe
            title={`${document.title} preview`}
            sandbox=""
            srcDoc={previewDocument(document.html)}
          />
          {document.scope === "comment" ? (
            <form
              className="shared-comment"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  data = new FormData(form);
                try {
                  await publicShareApi.comment(
                    token,
                    {
                      author_label: String(data.get("author_label")),
                      body: String(data.get("body")),
                    },
                    passcode || undefined,
                  );
                  form.reset();
                  setError("Comment sent to the document owner.");
                } catch {
                  setError("The comment could not be sent.");
                }
              }}
            >
              <h2>Leave a comment</h2>
              <label>
                Your name
                <input name="author_label" required maxLength={200} />
              </label>
              <label>
                Comment
                <textarea name="body" required maxLength={5000} rows={5} />
              </label>
              <button className="primary">Send comment</button>
            </form>
          ) : null}
        </>
      ) : (
        <form
          className="share-passcode"
          onSubmit={(e) => {
            e.preventDefault();
            void load(passcode);
          }}
        >
          <h1>Open shared document</h1>
          <p>
            This link may require a passcode. It is sent only in the secure
            request header.
          </p>
          <label>
            Passcode
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              minLength={4}
              autoComplete="one-time-code"
            />
          </label>
          <button className="primary">Open document</button>
        </form>
      )}
      {error ? (
        <p className={document ? "share-status" : "form-error"} role="status">
          {error}
        </p>
      ) : null}
    </main>
  );
}
