import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { collaborationApi } from "../../lib/api/phase3";
import { useSession } from "../../lib/auth/session";

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
