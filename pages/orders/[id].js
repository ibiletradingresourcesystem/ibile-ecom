import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  PhoneCall,
  Store,
  Truck,
  XCircle,
} from "lucide-react";

import { useStore } from "@/context/StoreContext";
import { getStoredOrderToken } from "@/lib/guestOrders";

const naira = (value) => `₦${Math.round(Number(value) || 0).toLocaleString()}`;

// The journey a cash-on-delivery order takes. Statuses outside this list
// (cancelled, expired) are rendered as their own terminal state instead.
const DELIVERY_STEPS = ["Pending", "Confirmed", "Processing", "Out for Delivery", "Delivered"];
const PICKUP_STEPS = ["Pending", "Confirmed", "Processing", "Ready for Pickup", "Delivered"];

const STEP_LABELS = {
  Pending: "Order placed",
  Confirmed: "Confirmed by store",
  Processing: "Being prepared",
  "Out for Delivery": "Out for delivery",
  "Ready for Pickup": "Ready for pickup",
  Delivered: "Completed",
};

const TERMINAL_STATUSES = {
  Cancelled: { title: "Order cancelled", tone: "is-cancelled" },
  "Reservation Expired": { title: "Order expired", tone: "is-cancelled" },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id, token: tokenFromUrl, placed } = router.query;
  const { store } = useStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const buildAuthParams = useCallback(() => {
    const accessToken = String(tokenFromUrl || "") || getStoredOrderToken(String(id || ""));
    const customerToken =
      typeof window !== "undefined" ? localStorage.getItem("customerToken") : null;

    return {
      query: accessToken ? `?token=${encodeURIComponent(accessToken)}` : "",
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    };
  }, [id, tokenFromUrl]);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let cancelled = false;

    async function loadOrder() {
      try {
        const { query, headers } = buildAuthParams();
        const res = await fetch(`/api/orders/${id}${query}`, { headers });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(
            res.status === 404
              ? "We could not find this order. Check the link, or sign in to the account that placed it."
              : data.error || "Unable to load this order."
          );
          return;
        }

        setOrder(data.order);
      } catch {
        if (!cancelled) setError("Unable to load this order right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();
    return () => { cancelled = true; };
  }, [router.isReady, id, buildAuthParams]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? The items will be returned to stock.")) return;

    setCancelling(true);
    try {
      const { query, headers } = buildAuthParams();
      const res = await fetch(`/api/orders/${id}${query}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "cancel", reason: "Cancelled by customer online." }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to cancel this order.");
      }

      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-page__inner"><div className="order-skeleton" /></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-page">
        <div className="order-page__inner">
          <div className="market-empty">
            <h1>Order unavailable</h1>
            <p>{error || "This order could not be found."}</p>
            <Link href="/products" className="order-page__link">Browse products</Link>
          </div>
        </div>
      </div>
    );
  }

  const isPickup = order.deliveryMethod === "pickup";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const terminal = TERMINAL_STATUSES[order.status];
  const currentStep = steps.indexOf(order.status);
  const storePhone = store?.storePhone || "";

  return (
    <>
      <Head><title>Order {order.orderNumber} | IbileMart Store</title></Head>
      <div className="order-page">
        <div className="order-page__inner">
          <Link href="/products" className="checkout-page__back">
            <ChevronLeft className="h-4 w-4" /> Continue shopping
          </Link>

          {placed === "1" && !terminal && (
            <div className="order-hero">
              <CheckCircle2 />
              <div>
                <h1>Thank you, your order is placed</h1>
                <p>
                  We have reserved your items. A store representative will call{" "}
                  {order.shippingDetails?.phone || "you"} shortly to confirm.
                </p>
              </div>
            </div>
          )}

          <div className="order-card">
            <div className="order-card__head">
              <div>
                <p>Order number</p>
                <h2>{order.orderNumber}</h2>
                <span>
                  Placed {new Date(order.createdAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <span className={`order-status ${terminal ? terminal.tone : "is-active"}`}>
                {terminal ? terminal.title : STEP_LABELS[order.status] || order.status}
              </span>
            </div>

            {terminal ? (
              <div className="order-terminal">
                <XCircle />
                <div>
                  <strong>{terminal.title}</strong>
                  <p>{order.cancellationReason || "This order is no longer being processed."}</p>
                </div>
              </div>
            ) : (
              <ol className="order-progress">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className={index <= currentStep ? "is-done" : ""}
                    aria-current={index === currentStep ? "step" : undefined}
                  >
                    <span />
                    <small>{STEP_LABELS[step] || step}</small>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="order-layout">
            <div className="order-card">
              <h3>Items</h3>
              <div className="checkout-summary__items">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.productId || item.name}-${index}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.quantity} x {naira(item.price)}</p>
                    </div>
                    <strong>{naira(Number(item.price) * Number(item.quantity))}</strong>
                  </div>
                ))}
              </div>

              <div className="checkout-summary__totals">
                <div><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
                <div>
                  <span>{isPickup ? "Store pickup" : "Delivery"}</span>
                  <span>{order.shippingCost > 0 ? naira(order.shippingCost) : "Free"}</span>
                </div>
                <div className="checkout-summary__total">
                  <span>Total</span><span>{naira(order.total)}</span>
                </div>
              </div>

              <div className="order-payment">
                <Banknote />
                <div>
                  <strong>{order.paymentMethod}</strong>
                  <p>
                    {order.paid
                      ? "Payment received. Thank you."
                      : `${naira(order.amountDueOnDelivery)} due in cash on ${isPickup ? "pickup" : "delivery"}.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="order-card">
              <h3>{isPickup ? "Pickup" : "Delivery"}</h3>

              <div className="order-detail-row">
                {isPickup ? <Store /> : <Truck />}
                <div>
                  <strong>{isPickup ? "Collect in store" : "Delivery to your address"}</strong>
                  {isPickup ? (
                    <p>{order.locationName || store?.companyAddress || "Our store counter"}</p>
                  ) : (
                    <p>
                      {order.shippingDetails?.address}
                      {order.shippingDetails?.city ? `, ${order.shippingDetails.city}` : ""}
                      {order.deliveryZoneName ? ` (${order.deliveryZoneName})` : ""}
                    </p>
                  )}
                  {order.deliveryEta && <p>Estimated: {order.deliveryEta}</p>}
                </div>
              </div>

              <div className="order-detail-row">
                <PhoneCall />
                <div>
                  <strong>Contact for this order</strong>
                  <p>{order.shippingDetails?.name} — {order.shippingDetails?.phone}</p>
                </div>
              </div>

              {order.deliveryNotes && (
                <div className="order-detail-row">
                  <MapPin />
                  <div>
                    <strong>Your notes</strong>
                    <p>{order.deliveryNotes}</p>
                  </div>
                </div>
              )}

              {order.deliveryPerson && (
                <div className="order-detail-row">
                  <Truck />
                  <div>
                    <strong>Your rider</strong>
                    <p>{order.deliveryPerson.name} {order.deliveryPerson.phone}</p>
                  </div>
                </div>
              )}

              <div className="order-actions">
                {storePhone && (
                  <a href={`tel:${storePhone}`} className="order-actions__call">
                    <PhoneCall /> Call the store
                  </a>
                )}
                {order.canCancel && (
                  <button type="button" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? "Cancelling..." : "Cancel order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
