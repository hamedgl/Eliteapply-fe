import { linkedApplicationIds, type Reference } from "../model";
import { ApplicationLink } from "./ApplicationLink";

/** Every application this reference is linked to — the original request plus any attached later. */
export function ReferenceApplicationUsage({ reference }: { reference: Reference }) {
  const ids = linkedApplicationIds(reference);
  return (
    <div className="reference-application-usage">
      <p className="apps-dialog-subtext">
        Used in {ids.length} application{ids.length === 1 ? "" : "s"}
      </p>
      <ul className="reference-application-list">
        {ids.map((id) => (
          <li key={id}>
            <ApplicationLink applicationId={id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
