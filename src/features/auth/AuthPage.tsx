import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import { useSession } from "../../lib/auth/session";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/errors";
import { productConfig } from "../../lib/config/product";
import { PASSWORD_RULES } from "./passwordRules";
import "./auth-form.css";

type Mode = "login" | "register" | "confirm" | "forgot";

const copy = {
  login: ["Welcome back", "Continue your applications with clarity."],
  register: [
    "Create your EliteApply account",
    "Build one calm home for every application.",
  ],
  confirm: ["Confirm your email", "Enter the code sent to your inbox."],
  forgot: [
    "Reset your password",
    "We’ll send a one-time code to your email.",
  ],
} as const;

export function AuthPage({ mode }: { mode: Mode }) {
  const nav = useNavigate();
  const location = useLocation();
  const setTokens = useSession((state) => state.setTokens);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      if (mode === "login") {
        const result = await authApi.login({
          email: String(data.email),
          password: String(data.password),
        });
        setTokens(result);
        const returnTo = new URLSearchParams(location.search).get("returnTo");
        nav(returnTo?.startsWith("/app") ? returnTo : "/app/dashboard", {
          replace: true,
        });
      }
      if (mode === "register") {
        await authApi.register({
          email: String(data.email),
          password: String(data.password),
          full_name: String(data.full_name) || null,
          accepted_terms_version: productConfig.legal.currentTermsVersion,
          marketing_opt_in: data.marketing_opt_in === "on",
        });
        nav(`/confirm-email?email=${encodeURIComponent(String(data.email))}`);
      }
      if (mode === "confirm") {
        await authApi.confirm({
          email: String(data.email),
          code: String(data.code),
        });
        setSuccess("Email confirmed. You can now sign in.");
      }
      if (mode === "forgot") {
        await authApi.forgot({ email: String(data.email) });
        nav(`/reset-password?email=${encodeURIComponent(String(data.email))}`);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  const [title, subtitle] = copy[mode];

  useEffect(() => {
    document.title = `${title} | EliteApply`;
  }, [title]);

  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <Link to="/" className="brand">
          EliteApply
        </Link>
        <div>
          <h2>
            Your applications
            <br />
            One clear system.
          </h2>
          <p>
            Organise every programme, deadline, document and decision without
            losing the story you want to tell.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <form
          className="auth-form"
          onSubmit={submit}
          aria-busy={busy}
          aria-describedby={error ? "form-error" : undefined}
        >
          <div className="auth-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {mode === "register" && (
            <label>
              Full name
              <input
                name="full_name"
                autoComplete="name"
                placeholder="Full name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              defaultValue={
                new URLSearchParams(location.search).get("email") ?? ""
              }
            />
          </label>
          {mode === "confirm" && (
            <label>
              Confirmation code
              <input
                name="code"
                required
                minLength={4}
                maxLength={10}
                autoComplete="one-time-code"
                placeholder="Confirmation code"
              />
            </label>
          )}
          {(mode === "login" || mode === "register") && (
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={mode === "login" ? 1 : 8}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          {mode === "register" && (
            <ul className="password-rules auth-password-rules" aria-label="Password requirements">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(password);
                return (
                  <li key={rule.key} className={met ? "met" : undefined}>
                    {met ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Circle aria-hidden="true" />
                    )}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
          {mode === "register" && (
            <>
              <label className="check">
                <input type="checkbox" required />I agree to the{" "}
                <Link to="/terms">Terms</Link> and{" "}
                <Link to="/privacy">Privacy Policy</Link>.
              </label>
              <label className="check">
                <input name="marketing_opt_in" type="checkbox" />
                Send useful product updates.
              </label>
            </>
          )}
          {error && (
            <p className="form-error" id="form-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="form-success" role="status">
              {success}
            </p>
          )}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : title}
          </button>
          <div className="auth-links">
            {mode === "login" ? (
              <>
                <Link to="/forgot-password">Forgot password?</Link>
                <Link to="/register">Create account</Link>
              </>
            ) : (
              <Link to="/login">Back to sign in</Link>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
