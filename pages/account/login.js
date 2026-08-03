import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/account");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In | IbileMart Store</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in to your IbileMart account</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </label>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link href="/account/register">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
