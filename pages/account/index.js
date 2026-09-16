import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import OrderHistory from "@/components/orders/OrderHistory";
import { Heart, Package, User, LogOut } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { customer, loading, logout, updateProfile, isAuthenticated, wishlist } = useAuth();
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Redirecting during render warns in React and can loop; do it as an effect.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/account/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <div className="auth-page"><p>Loading...</p></div>;
  }

  const handleEdit = () => {
    setForm({ name: customer.name, phone: customer.phone, address: customer.address });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await updateProfile(form);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <Head><title>My Account | IbileMart Store</title></Head>
      <div className="account-page">
        <div className="account-sidebar">
          <div className="account-sidebar__user">
            <div className="account-sidebar__avatar">{customer.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <div>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
            </div>
          </div>
          <nav className="account-sidebar__nav">
            <button onClick={() => setTab("profile")} className={tab === "profile" ? "is-active" : ""}>
              <User size={18} /> Profile
            </button>
            <button onClick={() => setTab("orders")} className={tab === "orders" ? "is-active" : ""}>
              <Package size={18} /> Orders
            </button>
            <button onClick={() => setTab("wishlist")} className={tab === "wishlist" ? "is-active" : ""}>
              <Heart size={18} /> Wishlist ({wishlist.length})
            </button>
            <button onClick={handleLogout} className="account-sidebar__logout">
              <LogOut size={18} /> Sign out
            </button>
          </nav>
        </div>

        <div className="account-content">
          {tab === "profile" && (
            <div className="account-section">
              <h2>Profile Details</h2>
              {message.text && (
                <div className={`account-message ${message.type === "success" ? "is-success" : "is-error"}`} role="status">
                  {message.text}
                </div>
              )}

              {editing ? (
                <form onSubmit={handleSave} className="account-form">
                  <label><span>Full name</span><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                  <label><span>Phone number</span><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                  <label><span>Delivery address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} /></label>
                  <div className="account-form__actions">
                    <button type="submit" disabled={saving} className="auth-submit">{saving ? "Saving..." : "Save changes"}</button>
                    <button type="button" onClick={() => setEditing(false)} className="auth-submit auth-submit--ghost">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="account-details">
                  <div className="account-details__row"><span>Name</span><strong>{customer.name}</strong></div>
                  <div className="account-details__row"><span>Email</span><strong>{customer.email}</strong></div>
                  <div className="account-details__row"><span>Phone</span><strong>{customer.phone || "—"}</strong></div>
                  <div className="account-details__row"><span>Address</span><strong>{customer.address || "—"}</strong></div>
                  <div className="account-details__row"><span>Member since</span><strong>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" }) : "—"}</strong></div>
                  <button onClick={handleEdit} className="auth-submit account-details__edit">Edit profile</button>
                </div>
              )}
            </div>
          )}

          {tab === "orders" && (
            <div className="account-section">
              <h2>Order History</h2>
              <OrderHistory />
            </div>
          )}

          {tab === "wishlist" && (
            <div className="account-section">
              <h2>Saved Items ({wishlist.length})</h2>
              {wishlist.length === 0 ? (
                <p className="account-empty">Items you save for later will appear here. <Link href="/products">Browse products</Link></p>
              ) : (
                <div className="account-wishlist">
                  {wishlist.map((product) => (
                    <div key={product._id} className="account-wishlist__item">
                      <div className="account-wishlist__info">
                        <strong>{product.name}</strong>
                        <span>₦{Number(product.salePriceIncTax || product.price || 0).toLocaleString()}</span>
                      </div>
                      <Link href={`/products/${product._id}`} className="account-wishlist__view">View</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
