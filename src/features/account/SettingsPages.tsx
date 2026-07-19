import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Camera, Download, ShieldAlert, Trash2 } from "lucide-react";
import { useSession } from "../../lib/auth/session";
import { usersApi } from "../../lib/api/users";
import { authApi } from "../../lib/api/auth";
import { productConfig } from "../../lib/config/product";
import { downloadResponse } from "../../lib/api/download";

type Status = { text: string; tone: "success" | "error" | "pending" } | null;

function FormStatus({ status }: { status: Status }) {
  return (
    <p
      className={`form-status${status ? ` is-${status.tone}` : ""}`}
      role="status"
    >
      {status?.text}
    </p>
  );
}

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function ProfileSettings() {
  const user = useSession((s) => s.user),
    setUser = useSession((s) => s.setUser),
    [saveStatus, setSaveStatus] = useState<Status>(null),
    [photoStatus, setPhotoStatus] = useState<Status>(null),
    [photoBusy, setPhotoBusy] = useState(false),
    fileInput = useRef<HTMLInputElement>(null);

  const initial = (user?.full_name || user?.email || "E")
    .slice(0, 1)
    .toUpperCase();

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setUser(
        await usersApi.update({
          full_name: String(d.full_name),
          headline: String(d.headline) || null,
          phone_number: String(d.phone_number) || null,
          timezone: String(d.timezone) || null,
          locale: String(d.locale) || null,
        }),
      );
      setSaveStatus({ text: "Profile saved.", tone: "success" });
    } catch (error) {
      setSaveStatus({
        text: errorText(error, "The profile could not be saved."),
        tone: "error",
      });
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    // Browsers often report no MIME type for .webp (unregistered OS mapping),
    // so fall back to the extension before rejecting — the API validates the
    // real bytes with a signature check.
    const imageTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const declared = file.type.toLowerCase();
    const type = Object.values(imageTypes).includes(declared)
      ? declared
      : declared === "" || declared === "application/octet-stream"
        ? imageTypes[file.name.split(".").pop()?.toLowerCase() ?? ""]
        : undefined;
    if (!type || file.size > 2 * 1024 * 1024) {
      setPhotoStatus({
        text: "Use a JPG, PNG or WebP under 2 MB.",
        tone: "error",
      });
      return;
    }
    const upload =
      type === file.type ? file : new File([file], file.name, { type });
    setPhotoBusy(true);
    setPhotoStatus({ text: "Uploading photo…", tone: "pending" });
    try {
      const profile = await usersApi.avatar(upload);
      setUser(profile);
      setPhotoStatus(
        profile.avatar_url
          ? { text: "Photo updated.", tone: "success" }
          : {
              text: "The photo was uploaded but the server did not return an image URL.",
              tone: "error",
            },
      );
    } catch (error) {
      setPhotoStatus({
        text: errorText(error, "The photo could not be uploaded."),
        tone: "error",
      });
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setPhotoStatus({ text: "Removing photo…", tone: "pending" });
    try {
      setUser(await usersApi.removeAvatar());
      setPhotoStatus({ text: "Photo removed.", tone: "success" });
    } catch (error) {
      setPhotoStatus({
        text: errorText(error, "The photo could not be removed."),
        tone: "error",
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <Settings
      title="Profile"
      description="How you appear across your workspace and to the people you share work with."
    >
      <section className="settings-card" aria-labelledby="photo-title">
        <header>
          <h2 id="photo-title">Profile photo</h2>
          <p>Shown beside your name in the workspace and shared views.</p>
        </header>
        <div className="settings-photo">
          <span className="settings-photo-preview" aria-hidden="true">
            {initial}
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                onError={(event) => event.currentTarget.remove()}
              />
            ) : null}
          </span>
          <div className="settings-photo-actions">
            <div>
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => fileInput.current?.click()}
              >
                <Camera aria-hidden="true" />
                {user?.avatar_url ? "Change photo" : "Upload photo"}
              </button>
              {user?.avatar_url ? (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={removePhoto}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p>JPG, PNG or WebP, up to 2 MB.</p>
            <FormStatus status={photoStatus} />
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Choose a profile photo"
            onChange={(e) => uploadPhoto(e.target.files?.[0])}
          />
        </div>
      </section>

      <section className="settings-card" aria-labelledby="identity-title">
        <header>
          <h2 id="identity-title">Personal details</h2>
          <p>Used across your applications, exports and references.</p>
        </header>
        <form className="settings-fields" onSubmit={save}>
          <label>
            Full name
            <input
              name="full_name"
              autoComplete="name"
              defaultValue={user?.full_name ?? ""}
            />
          </label>
          <label>
            Headline
            <input
              name="headline"
              defaultValue={user?.headline ?? ""}
              placeholder="Final-year biomedical sciences student"
            />
            <small>A short line about you, shown on shared material.</small>
          </label>
          <div className="settings-field-row">
            <label>
              Phone number
              <input
                name="phone_number"
                type="tel"
                autoComplete="tel"
                defaultValue={user?.phone_number ?? ""}
              />
            </label>
            <label>
              Timezone
              <input
                name="timezone"
                defaultValue={
                  user?.timezone ??
                  Intl.DateTimeFormat().resolvedOptions().timeZone
                }
                placeholder="Europe/Lisbon"
              />
            </label>
            <label>
              Locale
              <input
                name="locale"
                defaultValue={user?.locale ?? navigator.language}
                placeholder="en-GB"
              />
            </label>
          </div>
          <footer className="settings-card-footer">
            <FormStatus status={saveStatus} />
            <button className="primary">Save profile</button>
          </footer>
        </form>
      </section>
    </Settings>
  );
}

export function SecuritySettings() {
  const [status, setStatus] = useState<Status>(null);
  async function change(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    try {
      await authApi.changePassword({
        old_password: String(d.old_password),
        new_password: String(d.new_password),
      });
      form.reset();
      setStatus({ text: "Password changed.", tone: "success" });
    } catch (error) {
      setStatus({
        text: errorText(error, "The password could not be changed."),
        tone: "error",
      });
    }
  }
  return (
    <Settings
      title="Security"
      description="Keep access to your applications and documents under your control."
    >
      <section className="settings-card" aria-labelledby="password-title">
        <header>
          <h2 id="password-title">Change password</h2>
          <p>
            Use a password you don't use anywhere else. You stay signed in on
            this device.
          </p>
        </header>
        <form className="settings-fields" onSubmit={change}>
          <label>
            Current password
            <input
              name="old_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              name="new_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <small>At least 8 characters.</small>
          </label>
          <footer className="settings-card-footer">
            <FormStatus status={status} />
            <button className="primary">Change password</button>
          </footer>
        </form>
      </section>
    </Settings>
  );
}

export function PrivacySettings() {
  const user = useSession((s) => s.user),
    setUser = useSession((s) => s.setUser),
    clear = useSession((s) => s.clear),
    [code, setCode] = useState(""),
    [exportStatus, setExportStatus] = useState<Status>(null),
    [consentStatus, setConsentStatus] = useState<Status>(null),
    [deleteStatus, setDeleteStatus] = useState<Status>(null),
    [codeRequested, setCodeRequested] = useState(false);

  async function download() {
    setExportStatus({ text: "Preparing your export…", tone: "pending" });
    try {
      await downloadResponse(
        await usersApi.export(),
        "eliteapply-data-export.json",
      );
      setExportStatus({ text: "Export downloaded.", tone: "success" });
    } catch (error) {
      setExportStatus({
        text: errorText(error, "The export could not be prepared."),
        tone: "error",
      });
    }
  }

  async function consent(optIn: boolean) {
    try {
      setUser(
        await usersApi.consent({
          accepted_terms_version: productConfig.legal.currentTermsVersion,
          marketing_opt_in: optIn,
        }),
      );
      setConsentStatus({ text: "Preference saved.", tone: "success" });
    } catch (error) {
      setConsentStatus({
        text: errorText(error, "The preference could not be saved."),
        tone: "error",
      });
    }
  }

  async function requestDeletion() {
    try {
      await usersApi.requestDelete();
      setCodeRequested(true);
      setDeleteStatus({
        text: "A deletion code was sent to your email.",
        tone: "success",
      });
    } catch (error) {
      setDeleteStatus({
        text: errorText(error, "The deletion code could not be sent."),
        tone: "error",
      });
    }
  }

  async function confirmDeletion() {
    try {
      await usersApi.confirmDelete({ code });
      clear();
      location.href = "/";
    } catch (error) {
      setDeleteStatus({
        text: errorText(error, "The account could not be deleted."),
        tone: "error",
      });
    }
  }

  return (
    <Settings
      title="Privacy & data"
      description="Your work belongs to you. Export it at any time, or remove it entirely."
    >
      <section className="settings-card" aria-labelledby="export-title">
        <header>
          <h2 id="export-title">Your data</h2>
          <p>
            Download a complete copy of your applications, documents, writing
            and references as JSON.
          </p>
        </header>
        <div className="settings-inline-action">
          <button type="button" onClick={download}>
            <Download aria-hidden="true" />
            Download my data
          </button>
          <FormStatus status={exportStatus} />
        </div>
      </section>

      <section className="settings-card" aria-labelledby="consent-title">
        <header>
          <h2 id="consent-title">Communication</h2>
          <p>Deadline and account emails are always sent.</p>
        </header>
        <div className="settings-inline-action">
          <label className="check">
            <input
              type="checkbox"
              checked={user?.marketing_opt_in ?? false}
              onChange={(e) => consent(e.target.checked)}
            />
            Receive product updates and application guidance
          </label>
          <FormStatus status={consentStatus} />
        </div>
      </section>

      <section
        className="settings-card settings-danger"
        aria-labelledby="delete-title"
      >
        <header>
          <h2 id="delete-title">
            <ShieldAlert aria-hidden="true" />
            Delete account
          </h2>
          <p>
            Permanently removes your account, applications, documents and
            writing. This cannot be undone.
          </p>
        </header>
        <div className="settings-fields">
          {codeRequested ? (
            <>
              <label>
                Deletion code
                <input
                  value={code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={(e) => setCode(e.target.value)}
                  minLength={6}
                />
                <small>Enter the code from the email we just sent you.</small>
              </label>
              <footer className="settings-card-footer">
                <FormStatus status={deleteStatus} />
                <button
                  type="button"
                  className="danger"
                  disabled={code.length < 6}
                  onClick={confirmDeletion}
                >
                  <Trash2 aria-hidden="true" />
                  Permanently delete account
                </button>
              </footer>
            </>
          ) : (
            <footer className="settings-card-footer">
              <FormStatus status={deleteStatus} />
              <button type="button" className="danger" onClick={requestDeletion}>
                Request deletion code
              </button>
            </footer>
          )}
        </div>
      </section>
    </Settings>
  );
}

const settingsTabs = [
  { to: "/app/settings/profile", label: "Profile" },
  { to: "/app/settings/security", label: "Security" },
  { to: "/app/settings/privacy", label: "Privacy" },
  { to: "/app/settings/billing", label: "Billing & usage" },
];

function Settings({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page settings">
      <header className="settings-heading">
        <h1>Settings</h1>
        <p>{description}</p>
        <nav aria-label="Settings">
          {settingsTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                isActive || tab.label === title ? "active" : undefined
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="settings-sections">{children}</div>
    </div>
  );
}
