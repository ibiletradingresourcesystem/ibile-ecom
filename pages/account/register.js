import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/account");
    return null;
  }

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      router.push("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Create Account | IbileMart Store</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p>Join IbileMart for a better shopping experience</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>
              <span>Full name *</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
            </label>
            <label>
              <span>Email address *</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
            </label>
            <label>
              <span>Phone number</span>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="080xxxxxxxx" />
            </label>
            <label>
              <span>Password *</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="At least 6 characters" minLength={6} />
            </label>
            <label>
              <span>Confirm password *</span>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" minLength={6} />
            </label>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href="/account/login">Sign in</Link>
          </p>

          <p className="auth-legal">
            By creating an account, you agree to our <Link href="/legal/terms">Terms of Service</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
