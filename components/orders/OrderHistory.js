import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, PackageSearch, Store, Truck } from "lucide-react";

import { getStoredOrders } from "@/lib/guestOrders";

const naira = (value) => `₦${Math.round(Number(value) || 0).toLocaleString()}`;

const STATUS_TONE = {
  Delivered: "is-done",
  Cancelled: "is-cancelled",
  "Reservation Expired": "is-cancelled",
};

/**
 * Shows every order this person can prove they own: the ones on their account,
 * plus any guest orders placed from this browser (which carry a signed access
 * token rather than an account).
 */
export default function OrderHistory({ limit = 0 }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const collected = new Map();
      const customerToken = localStorage.getItem("customerToken");

      if (customerToken) {
        try {
          const res = await fetch("/api/orders", {
            headers: { Authorization: `Bearer ${customerToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            for (const order of data.orders || []) collected.set(order.id, order);
          }
        } catch {
          if (!cancelled) setError("Some orders could not be loaded.");
        }
      }

      // Guest orders from this browser, fetched one at a time with their tokens.
      const storedOrders = getStoredOrders().filter((entry) => !collected.has(entry.id));

      await Promise.all(
        storedOrders.slice(0, 10).map(async (entry) => {
          try {
            const res = await fetch(`/api/orders/${entry.id}?token=${encodeURIComponent(entry.token)}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.order) collected.set(data.order.id, { ...data.order, accessToken: entry.token });
          } catch {
            // A single unreachable order should not blank the whole list.
          }
        })
      );

      if (cancelled) return;

      const sorted = [...collected.values()].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders(limit > 0 ? sorted.slice(0, limit) : sorted);
    }

    // Whatever happens, stop showing the skeleton — an empty list with an
    // explanation beats a spinner that never resolves.
    loadOrders()
      .catch(() => setError("We could not load your orders right now."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return <div className="order-skeleton" aria-busy="true" aria-label="Loading orders" />;
  }

  if (orders.length === 0) {
    return (
      <p className="account-empty">
        {error || "You have not placed any orders yet."}{" "}
        <Link href="/products">Browse products</Link>
      </p>
    );
  }

  return (
    <div className="order-history">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}${order.accessToken ? `?token=${encodeURIComponent(order.accessToken)}` : ""}`}
          className="order-history__item"
        >
          <div className="order-history__main">
            <div className="order-history__head">
              <strong>{order.orderNumber}</strong>
              <span className={`order-status ${STATUS_TONE[order.status] || "is-active"}`}>
                {order.status}
              </span>
            </div>
            <span className="order-history__meta">
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" · "}
              {(order.items || []).length} {(order.items || []).length === 1 ? "item" : "items"}
            </span>
            <span className="order-history__meta">
              {order.deliveryMethod === "pickup" ? <Store size={14} /> : <Truck size={14} />}
              {order.deliveryMethod === "pickup" ? "Store pickup" : "Delivery"}
            </span>
          </div>
          <div className="order-history__amount">
            <strong>{naira(order.total)}</strong>
            {!order.paid && (
              <small><Banknote size={13} /> Cash on {order.deliveryMethod === "pickup" ? "pickup" : "delivery"}</small>
            )}
          </div>
          <PackageSearch className="order-history__chevron" />
        </Link>
      ))}
    </div>
  );
}
