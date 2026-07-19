import { useState } from "react";
import { useSession } from "../../lib/auth/session";
import { usersApi } from "../../lib/api/users";
import { authApi } from "../../lib/api/auth";
import { productConfig } from "../../lib/config/product";
import { downloadResponse } from "../../lib/api/download";
export function ProfileSettings() {
  const user = useSession((s) => s.user),
    setUser = useSession((s) => s.setUser),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setUser(
      await usersApi.update({
        full_name: String(d.full_name),
        headline: String(d.headline) || null,
        phone_number: String(d.phone_number) || null,
        timezone: String(d.timezone) || null,
        locale: String(d.locale) || null,
      }),
    );
    setMessage("Profile saved.");
  }
  async function avatar(file?: File) {
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
      setMessage("Use a JPG, PNG or WebP under 2 MB.");
      return;
    }
    const upload =
      type === file.type ? file : new File([file], file.name, { type });
    setMessage("Uploading photo…");
    try {
      const profile = await usersApi.avatar(upload);
      setUser(profile);
      setMessage(
        profile.avatar_url
          ? "Photo updated."
          : "The photo was uploaded but the server did not return an image URL.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Photo upload failed: ${error.message}`
          : "Photo upload failed.",
      );
    }
  }
  return (
    <Settings title="Profile">
      <form className="settings-form" onSubmit={save}>
        <label>
          Profile photo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => avatar(e.target.files?.[0])}
          />
        </label>
        <label>
          Full name
          <input name="full_name" defaultValue={user?.full_name ?? ""} />
        </label>
        <label>
          Headline
          <input name="headline" defaultValue={user?.headline ?? ""} />
        </label>
        <label>
          Phone number
          <input name="phone_number" defaultValue={user?.phone_number ?? ""} />
        </label>
        <label>
          Timezone
          <input name="timezone" defaultValue={user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone} placeholder="Europe/Lisbon" />
        </label>
        <label>
          Locale
          <input name="locale" defaultValue={user?.locale ?? navigator.language} placeholder="en-GB" />
        </label>
        <button className="primary">Save profile</button>
        <p role="status">{message}</p>
      </form>
    </Settings>
  );
}
export function SecuritySettings() {
  const [message, setMessage] = useState("");
  async function change(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    await authApi.changePassword({
      old_password: String(d.old_password),
      new_password: String(d.new_password),
    });
    e.currentTarget.reset();
    setMessage("Password changed.");
  }
  return (
    <Settings title="Security">
      <form className="settings-form" onSubmit={change}>
        <label>
          Current password
          <input name="old_password" type="password" required />
        </label>
        <label>
          New password
          <input name="new_password" type="password" minLength={8} required />
        </label>
        <button className="primary">Change password</button>
        <p role="status">{message}</p>
      </form>
    </Settings>
  );
}
export function PrivacySettings() {
  const clear = useSession((s) => s.clear),
    [code, setCode] = useState(""),
    [message, setMessage] = useState("");
  async function download() {
    await downloadResponse(await usersApi.export(), "eliteapply-data-export.json");
  }
  async function deletion() {
    await usersApi.requestDelete();
    setMessage("A deletion code was sent to your email.");
  }
  async function confirm() {
    await usersApi.confirmDelete({ code });
    clear();
    location.href = "/";
  }
  return (
    <Settings title="Privacy & data">
      <div className="settings-form">
        <button onClick={download}>Download my data</button>
        <label className="check">
          <input
            type="checkbox"
            defaultChecked={false}
            onChange={(e) =>
              usersApi.consent({
                accepted_terms_version: productConfig.legal.currentTermsVersion,
                marketing_opt_in: e.target.checked,
              })
            }
          />
          Receive product updates
        </label>
        <hr />
        <h2>Delete account</h2>
        <p>This permanently removes your account and application data.</p>
        <button className="danger" onClick={deletion}>
          Request deletion code
        </button>
        {message && (
          <>
            <p role="status">{message}</p>
            <label>
              Deletion code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                minLength={6}
              />
            </label>
            <button
              className="danger"
              disabled={code.length < 6}
              onClick={confirm}
            >
              Permanently delete account
            </button>
          </>
        )}
      </div>
    </Settings>
  );
}
function Settings({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page settings">
      <header>
        <h1>{title}</h1>
        <nav aria-label="Settings">
          <a href="/app/settings/profile">Profile</a>
          <a href="/app/settings/security">Security</a>
          <a href="/app/settings/privacy">Privacy</a>
          <a href="/app/settings/billing">Billing & usage</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
