import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { DEFAULT_API_BASE, getApiBase, setApiBase } from "../config.js";
import ErrorBox from "../components/common/ErrorBox.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const showToast = useToast();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiBase, setApiBaseField] = useState(getApiBase());

  // Already signed in (or just signed in): go where they were headed.
  if (user) return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;

  const commitApiBase = () => {
    if (apiBase.trim().replace(/\/+$/, "") === getApiBase()) return;
    setApiBase(apiBase);
    setApiBaseField(getApiBase());
    showToast("API URL updated");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">CuraFlow</div>
        <div className="auth-tagline">Sign in to your caregiver workspace.</div>

        <div>{error && <ErrorBox>{error}</ErrorBox>}</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-id">Email or username</label>
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-pw">Password</label>
            <input
              id="login-pw"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <details className="mt-16">
          <summary className="muted" style={{ cursor: "pointer" }}>
            Backend API URL
          </summary>
          <div className="field mt-16 mb-0">
            <input
              id="api-base-input"
              type="text"
              aria-label="Backend API URL"
              value={apiBase}
              onChange={(e) => setApiBaseField(e.target.value)}
              onBlur={commitApiBase}
            />
            <div className="field-hint">
              Defaults to <code>{DEFAULT_API_BASE}</code>, which this app forwards to the backend. To call a backend
              directly instead (e.g. <code>http://localhost:8000/api/v1</code>), enter its URL here — clear the field to
              go back to the default.
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
