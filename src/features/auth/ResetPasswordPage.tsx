import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/errors";
import "./auth-form.css";

const PASSWORD_RULES: Array<{
  key: string;
  label: string;
  test: (value: string) => boolean;
}> = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  {
    key: "symbol",
    label: "One symbol",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function isCodeRelated(message: string) {
  return /\bcode\b|expired/i.test(message);
}

function AuthBrand() {
  return (
    <section className="auth-brand">
      <Link to="/" className="brand">
        EliteApply
      </Link>
      <div>
        <h2>
          Your applications.
          <br />
          One clear system.
        </h2>
        <p>
          Organise every programme, deadline, document and decision without
          losing the story you want to tell.
        </p>
      </div>
    </section>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const linkEmail = params.get("email") ?? "";
  const linkCode = params.get("code") ?? "";
  const hasDirectLink = linkEmail.trim() !== "" && linkCode.trim() !== "";

  const [email, setEmail] = useState(linkEmail);
  const [code, setCode] = useState(linkCode);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<
    "none" | "fatal" | "code" | "other"
  >("none");
  const [success, setSuccess] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    document.title = success
      ? "Password updated | EliteApply"
      : errorKind === "fatal"
        ? "Something went wrong | EliteApply"
        : "Choose a new password | EliteApply";
  }, [success, errorKind]);

  const rulesPassed = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit =
    rulesPassed &&
    passwordsMatch &&
    email.trim() !== "" &&
    code.trim() !== "" &&
    !busy;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    setErrorKind("none");
    const submittedEmail = email;
    try {
      await authApi.reset({ email, code, new_password: password });
      setSuccess(true);
      window.setTimeout(() => {
        nav(`/login?email=${encodeURIComponent(submittedEmail)}`, {
          replace: true,
        });
      }, 1600);
    } catch (x) {
      if (x instanceof ApiError) {
        if (x.status === 404) {
          setErrorKind("fatal");
          setError(
            "Something went wrong. Request a new reset email and try again.",
          );
        } else if (x.status === 400) {
          setErrorKind(isCodeRelated(x.message) ? "code" : "other");
          setError(x.message);
        } else {
          setErrorKind("other");
          setError("EliteApply is temporarily unavailable. Try again shortly.");
        }
      } else {
        setErrorKind("other");
        setError("Something went wrong. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resendLink() {
    if (!email.trim()) return;
    setResendBusy(true);
    try {
      await authApi.forgot({ email });
      setResendSent(true);
    } catch {
      // Original error stays visible; a failed resend isn't worth a second alert.
    } finally {
      setResendBusy(false);
    }
  }

  if (success) {
    return (
      <main className="auth-layout">
        <AuthBrand />
        <section className="auth-panel">
          <div className="auth-form">
            <div>
              <h1>Password updated</h1>
              <p>You can now sign in with your new password.</p>
            </div>
            <p className="form-success" role="status">
              Redirecting you to sign in…
            </p>
            <Link
              className="primary"
              to={`/login?email=${encodeURIComponent(email)}`}
            >
              Continue to sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (errorKind === "fatal") {
    return (
      <main className="auth-layout">
        <AuthBrand />
        <section className="auth-panel">
          <div className="auth-form">
            <div>
              <h1>Something went wrong</h1>
              <p>{error}</p>
            </div>
            <Link className="primary" to="/forgot-password">
              Request a new reset email
            </Link>
            <Link to="/login">Back to sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <AuthBrand />
      <section className="auth-panel">
        <form
          className="auth-form"
          onSubmit={submit}
          aria-describedby={error ? "form-error" : undefined}
        >
          <div>
            <h1>Choose a new password</h1>
            <p>Use at least eight characters, mixing case, a number and a symbol.</p>
          </div>
          {!hasDirectLink && (
            <>
              <label>
                Email address
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Confirmation code
                <input
                  required
                  minLength={4}
                  maxLength={10}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            New password
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <ul className="password-rules">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.key} className={met ? "met" : undefined}>
                  {met ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <XCircle aria-hidden="true" />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
          <label>
            Confirm password
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <small>Passwords do not match.</small>
            )}
          </label>
          {error && (
            <p className="form-error" id="form-error" role="alert">
              <AlertTriangle aria-hidden="true" /> {error}
            </p>
          )}
          {errorKind === "code" && (
            <button
              type="button"
              onClick={resendLink}
              disabled={resendBusy || resendSent}
            >
              {resendSent
                ? "New link sent — check your email"
                : resendBusy
                  ? "Sending…"
                  : "Send me a new link"}
            </button>
          )}
          <button className="primary" disabled={!canSubmit}>
            {busy ? "Updating…" : "Update password"}
          </button>
          <div className="auth-links">
            <Link to="/login">Back to sign in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
