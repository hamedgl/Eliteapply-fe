import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../../lib/api/users";
import { useSession } from "../../../lib/auth/session";

/**
 * One-time explanation of the starter rows the API seeds at signup.
 *
 * Visibility is driven entirely by `sample_data_seeded_at` on the profile, which the
 * API sets once after seeding and clears when this notice is dismissed. It is null for
 * every pre-existing account (there was no backfill) and for a signup whose seeding
 * failed — both correctly mean "nothing to announce", so no client-side flag is needed
 * and the state survives a new device or a cleared browser.
 *
 * Dismissing only hides the notice. The seeded rows stay, and keep their `Sample`
 * badge, so the explanation disappearing never leaves demo data unlabelled.
 */
export function SampleDataNotice() {
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const [dismissing, setDismissing] = useState(false);

  if (!user?.sample_data_seeded_at) return null;

  const dismiss = async () => {
    setDismissing(true);
    try {
      setUser(await usersApi.dismissSampleNotice());
    } catch {
      // A failed dismiss is not worth an error surface: the notice is informational and
      // the request retries the next time the user clicks. Re-enable the button.
      setDismissing(false);
    }
  };

  return (
    <aside className="dashboard-sample-notice" aria-labelledby="sample-notice-heading">
      <Sparkles aria-hidden="true" />
      <div>
        <h2 id="sample-notice-heading">We added a few examples to get you started</h2>
        <p>
          Your workspace already has one sample application, document, draft, story,
          reminder, saved search, reference request and interview — each marked{" "}
          <span className="apps-stage-pill apps-tone-grey">Sample</span>. Explore them,
          edit them, or delete them whenever you like.
        </p>
        <Link to="/app/applications">Go to applications</Link>
      </div>
      <button
        type="button"
        className="dashboard-sample-notice-dismiss"
        onClick={() => void dismiss()}
        disabled={dismissing}
        aria-label="Dismiss the sample data notice"
      >
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}
