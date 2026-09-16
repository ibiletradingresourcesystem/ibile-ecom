import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { CheckCircle2, MailWarning } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isAuthenticated, refreshProfile } = useAuth();

  const [state, setState] = useState("checking"); // checking | done | failed
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");

  const verify = useCallback(
    async (token) => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "We could not confirm this email.");
          setState("failed");
          return;
        }

        setEmail(data.email || "");
        setState("done");

        // If this browser is signed in, drop the stale unverified profile.
        if (isAuthenticated) refreshProfile().catch(() => {});
      } catch {
        setError("We could not reach the server. Please try again.");
        setState("failed");
      }
    },
    [isAuthenticated, refreshProfile]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const token = typeof router.query.token === "string" ? router.query.token : "";

    if (!token) {
      setError("This verification link is not valid.");
      setState("failed");
      return;
    }

    // Take the token out of the address bar so it is not kept in history.
    window.history.replaceState(null, "", "/account/verify-email");
    verify(token);
  }, [router.isReady, router.query.token, verify]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResending(true);
    setResendNote("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Could not send the email.");

      setResendNote(data.alreadyVerified ? "That email is already confirmed." : data.message);
    } catch (err) {
      setResendNote(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Head><title>Confirm your email | IbileMart Store</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          {state === "checking" && (
            <div className="auth-sent">
              <h1>Confirming your email…</h1>
              <p>One moment.</p>
            </div>
          )}

          {state === "done" && (
            <div className="auth-sent">
              <span className="auth-sent__icon is-success"><CheckCircle2 aria-hidden="true" /></span>
              <h1>Email confirmed</h1>
              <p>
                {email ? <><strong>{email}</strong> is confirmed.</> : "Your email is confirmed."}{" "}
                We can now send you updates about your orders.
              </p>
              <Link
                href={isAuthenticated ? "/account" : "/account/login"}
                className="auth-submit auth-submit--link"
              >
                {isAuthenticated ? "Go to my account" : "Sign in"}
              </Link>
            </div>
          )}

          {state === "failed" && (
            <div className="auth-sent">
              <span className="auth-sent__icon is-warning"><MailWarning aria-hidden="true" /></span>
              <h1>Link no longer valid</h1>
              <p>{error}</p>

              <form onSubmit={handleResend} className="verify-resend">
                <label>
                  <span>Send a new link to</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
                <button type="submit" disabled={resending} className="auth-submit">
                  {resending ? "Sending..." : "Send a new link"}
                </button>
              </form>

              {resendNote && <p className="auth-sent__hint" role="status">{resendNote}</p>}

              <p className="auth-switch">
                <Link href="/account/login">Back to sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
