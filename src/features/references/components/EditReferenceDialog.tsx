import { useState } from "react";
import { X } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { referenceTypes, referenceTypeLabel, type Reference } from "../model";

const REFEREE_ROLES = ["professor", "supervisor", "teacher", "employer", "mentor"] as const;

/** Editing is only ever offered while the reference is still `invited` (API-enforced). */
export function EditReferenceDialog({
  reference,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  reference: Reference;
  pending: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (patch: {
    referee_name: string;
    referee_role: (typeof REFEREE_ROLES)[number];
    institution: string;
    department: string;
    reference_type: (typeof referenceTypes)[number];
    student_context: string;
  }) => void;
}) {
  const [refereeName, setRefereeName] = useState(reference.referee_name);
  const [refereeRole, setRefereeRole] = useState<(typeof REFEREE_ROLES)[number]>(
    reference.referee_role as (typeof REFEREE_ROLES)[number],
  );
  const [institution, setInstitution] = useState(reference.institution ?? "");
  const [department, setDepartment] = useState("");
  const [referenceType, setReferenceType] = useState(reference.reference_type);
  const [studentContext, setStudentContext] = useState("");

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="apps-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-reference-title" onClick={(e) => e.stopPropagation()}>
        <header className="apps-dialog-header">
          <h2 id="edit-reference-title">Edit request</h2>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-dialog-body">
          {error ? <div className="apps-notice is-danger">{error}</div> : null}
          <label>
            Referee name
            <input value={refereeName} onChange={(event) => setRefereeName(event.target.value)} required />
          </label>
          <label>
            Role
            <Select
              value={refereeRole}
              onChange={(val: any) =>
                setRefereeRole((typeof val === "string" ? val : val?.target?.value) as (typeof REFEREE_ROLES)[number])
              }
              options={REFEREE_ROLES.map((role) => ({ value: role, label: role }))}
            />
          </label>
          <label>
            Institution
            <input value={institution} onChange={(event) => setInstitution(event.target.value)} />
          </label>
          <label>
            Department
            <input value={department} onChange={(event) => setDepartment(event.target.value)} />
          </label>
          <label>
            Reference type
            <Select
              value={referenceType}
              onChange={(val: any) =>
                setReferenceType((typeof val === "string" ? val : val?.target?.value) as (typeof referenceTypes)[number])
              }
              options={referenceTypes.map((type) => ({ value: type, label: referenceTypeLabel(type) }))}
            />
          </label>
          <label>
            Updated context for the referee
            <textarea value={studentContext} onChange={(event) => setStudentContext(event.target.value)} rows={3} />
          </label>
        </div>
        <div className="apps-dialog-footer">
          <button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            disabled={pending}
            onClick={() =>
              onSubmit({
                referee_name: refereeName,
                referee_role: refereeRole,
                institution,
                department,
                reference_type: referenceType,
                student_context: studentContext,
              })
            }
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
