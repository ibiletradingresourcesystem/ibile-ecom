import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Could not send the reset link.");

      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Forgot Password | IbileMart Store</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          {sent ? (
            <div className="auth-sent">
              <span className="auth-sent__icon"><MailCheck aria-hidden="true" /></span>
              <h1>Check your email</h1>
              <p>
                If <strong>{email}</strong> is registered with us, a link to choose a new
                password is on its way. It expires in an hour.
              </p>
              <p className="auth-sent__hint">
                Nothing arrived? Check your spam folder, or{" "}
                <button type="button" className="auth-linkbutton" onClick={() => setSent(false)}>
                  try a different email
                </button>.
              </p>
              <Link href="/account/login" className="auth-submit auth-submit--link">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1>Forgot your password?</h1>
              <p>Enter the email on your account and we will send you a reset link.</p>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form onSubmit={handleSubmit}>
                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="auth-switch">
                Remembered it? <Link href="/account/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
