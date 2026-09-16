import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

import PasswordInput from "@/components/account/PasswordInput";
import { useAuth } from "@/context/AuthContext";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { applySession } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [heldToken, setHeldToken] = useState("");

  // Take the token out of the URL as soon as it is read, so it does not linger
  // in browser history or get shared if the customer copies the address.
  useEffect(() => {
    if (!router.isReady) return;

    const token = typeof router.query.token === "string" ? router.query.token : "";
    if (!token) return;

    setHeldToken(token);
    window.history.replaceState(null, "", "/account/reset-password");
  }, [router.isReady, router.query.token]);

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: heldToken, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Could not reset your password.");

      applySession(data.token, data.customer);
      router.replace("/account");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (router.isReady && !heldToken) {
    return (
      <>
        <Head><title>Reset Password | IbileMart Store</title></Head>
        <div className="auth-page">
          <div className="auth-card">
            <h1>This link is not valid</h1>
            <p>
              Password reset links expire after an hour and can only be used once.
              Request a fresh one to continue.
            </p>
            <Link href="/account/forgot-password" className="auth-submit auth-submit--link">
              Request a new link
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Reset Password | IbileMart Store</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Choose a new password</h1>
          <p>Pick something you have not used on this account before.</p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <PasswordInput
              label="New password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
            />
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Saving..." : "Save new password"}
            </button>
          </form>

          <p className="auth-switch">
            <Link href="/account/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
