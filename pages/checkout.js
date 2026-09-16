import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { rememberOrder } from "@/lib/guestOrders";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  landmark: "",
};

const naira = (value) => `₦${Math.round(Number(value) || 0).toLocaleString()}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartLoaded, totalAmount, totalItems, clearCart, syncCartWithServer } = useCart();
  const { store } = useStore();
  const { customer, isAuthenticated } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [pricing, setPricing] = useState(null);
  const [cartNotices, setCartNotices] = useState([]);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const deliverySettings = store?.delivery;
  const pickupAvailable = deliverySettings?.pickupAvailable !== false;
  const locations = useMemo(() => store?.locations || [], [store]);
  const isDelivery = deliveryMethod === "delivery";

  // Prefill from the signed-in profile so returning customers do not retype
  // details the store already holds.
  useEffect(() => {
    if (prefilled || !isAuthenticated || !customer) return;

    setForm((current) => ({
      ...current,
      name: current.name || customer.name || "",
      email: current.email || customer.email || "",
      phone: current.phone || customer.phone || "",
      address: current.address || customer.address || "",
    }));
    setPrefilled(true);
  }, [customer, isAuthenticated, prefilled]);

  // Only one branch: no need to make the customer pick it.
  useEffect(() => {
    if (locations.length === 1 && !selectedLocation) {
      setSelectedLocation(locations[0]._id);
    }
  }, [locations, selectedLocation]);

  const cartSignature = useMemo(
    () => cart.map((item) => `${item._id}:${item.quantity}`).join("|"),
    [cart]
  );

  const appliedNoticeSignature = useRef("");

  /**
   * Re-prices the cart against live inventory and asks the server for the
   * delivery fee, so the amount shown here is the amount that will be collected.
   */
  const revalidate = useCallback(async () => {
    if (!cartLoaded || cart.length === 0) {
      setPricing(null);
      return;
    }

    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
          deliveryMethod,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setPricing(data);

      const signature = (data.changes || []).map((change) => change.message).join("|");

      if (signature && signature !== appliedNoticeSignature.current) {
        appliedNoticeSignature.current = signature;
        setCartNotices(data.changes.map((change) => change.message));
        syncCartWithServer(data.items);
      } else if (!signature) {
        // Applying the changes above re-runs this check with a now-clean cart.
        // The notice stays on screen — it is what explains the new totals — but
        // the signature resets so a later change can raise a fresh notice.
        appliedNoticeSignature.current = "";
      }
    } catch {
      // Keep the locally cached totals; the server re-prices on submit anyway.
    }
  }, [cart, cartLoaded, deliveryMethod, syncCartWithServer]);

  useEffect(() => {
    revalidate();
    // cartSignature keeps this from re-firing on every unrelated cart re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature, cartLoaded, deliveryMethod]);

  const subtotal = pricing?.subtotal ?? totalAmount;
  const deliveryQuote = pricing?.delivery;

  // The store sets delivery pricing in the inventory app. When it has not set
  // any, nothing is added here and the fee is settled on the confirmation call.
  const deliveryConfigured = isDelivery
    ? deliveryQuote?.configured ?? deliverySettings?.configured ?? false
    : true;
  const deliveryFee = isDelivery && deliveryConfigured ? deliveryQuote?.fee ?? 0 : 0;
  const total = subtotal + deliveryFee;

  const deliveryFeeLabel = !isDelivery
    ? "Free"
    : deliveryConfigured
      ? naira(deliveryFee)
      : "Confirmed by store";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      setStatus({ type: "error", message: "Your cart is empty." });
      return;
    }

    if (!isDelivery && locations.length > 0 && !selectedLocation) {
      setStatus({ type: "error", message: "Please choose which store you will collect from." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const location = locations.find((loc) => loc._id === selectedLocation);
      const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") : null;

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
          customer: form,
          deliveryMethod,
          deliveryNotes,
          locationId: selectedLocation || undefined,
          locationName: location?.name || "",
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Unable to create order.");
      }

      rememberOrder({
        id: orderData.order.id,
        token: orderData.accessToken,
        orderNumber: orderData.order.orderNumber,
        total: orderData.order.total,
        createdAt: orderData.order.createdAt,
      });

      clearCart();
      router.push(
        `/orders/${orderData.order.id}?token=${encodeURIComponent(orderData.accessToken || "")}&placed=1`
      );
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Checkout failed." });
      setSubmitting(false);
      revalidate();
    }
  };

  return (
    <>
      <Head><title>Checkout | IbileMart Store</title></Head>
      <section className="checkout-page">
        <div className="checkout-page__inner">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="checkout-page__back"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </button>

          <div className="checkout-page__layout">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="checkout-panel-heading">
                <div>
                  <p>Checkout</p>
                  <h1>{isDelivery ? "Delivery details" : "Pickup details"}</h1>
                </div>
                <div>
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              {cartNotices.length > 0 && (
                <div className="checkout-notice" role="status">
                  <AlertTriangle />
                  <div>
                    <strong>Your cart was updated</strong>
                    <ul>
                      {cartNotices.map((notice) => (
                        <li key={notice}>{notice}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <fieldset className="checkout-methods">
                <legend>How would you like to get your order?</legend>
                <div>
                  <button
                    type="button"
                    className={`checkout-method ${isDelivery ? "is-active" : ""}`}
                    onClick={() => setDeliveryMethod("delivery")}
                    aria-pressed={isDelivery}
                  >
                    <Truck />
                    <span>
                      <strong>Deliver to me</strong>
                      <small>
                        {deliveryConfigured
                          ? deliveryFee > 0
                            ? `${naira(deliveryFee)} delivery fee`
                            : "No delivery fee"
                          : "Fee confirmed by the store"}
                      </small>
                    </span>
                  </button>

                  {pickupAvailable && (
                    <button
                      type="button"
                      className={`checkout-method ${!isDelivery ? "is-active" : ""}`}
                      onClick={() => setDeliveryMethod("pickup")}
                      aria-pressed={!isDelivery}
                    >
                      <Store />
                      <span>
                        <strong>Pick up in store</strong>
                        <small>No delivery fee</small>
                      </span>
                    </button>
                  )}
                </div>
              </fieldset>

              <div className="checkout-fields">
                <label>
                  Full name
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Phone
                  <input
                    required
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="08012345678"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>
                <label className="checkout-fields__wide">
                  Email <span className="checkout-optional">&mdash; for your order updates</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </label>

                {isDelivery ? (
                  <>
                    <label>
                      City or town
                      <input
                        required
                        name="city"
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Nearest landmark <span className="checkout-optional">&mdash; optional</span>
                      <input
                        name="landmark"
                        placeholder="e.g. opposite the filling station"
                        value={form.landmark}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="checkout-fields__wide">
                      Delivery address
                      <textarea
                        required
                        name="address"
                        autoComplete="street-address"
                        value={form.address}
                        onChange={handleChange}
                        rows={3}
                      />
                    </label>
                  </>
                ) : (
                  locations.length > 0 && (
                    <label className="checkout-fields__wide">
                      Pick up from
                      <select
                        required
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option value="">Select a store</option>
                        {locations.map((loc) => (
                          <option key={loc._id} value={loc._id}>
                            {loc.name}{loc.address ? ` — ${loc.address}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                )}

                {isDelivery && locations.length > 1 && (
                  <label className="checkout-fields__wide">
                    Preferred store location <span className="checkout-optional">&mdash; optional</span>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">No preference</option>
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.name}{loc.address ? ` — ${loc.address}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="checkout-fields__wide">
                  Order notes <span className="checkout-optional">&mdash; optional</span>
                  <textarea
                    name="deliveryNotes"
                    value={deliveryNotes}
                    onChange={(event) => setDeliveryNotes(event.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Anything our team should know before delivering"
                  />
                </label>
              </div>

              <div className="checkout-payment">
                <div className="checkout-payment__head">
                  <Banknote />
                  <div>
                    <strong>Payment method</strong>
                    <p>Cash on delivery is the only payment method for online orders.</p>
                  </div>
                </div>
                <div className="checkout-payment__option">
                  <span className="checkout-payment__radio" aria-hidden="true" />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>
                      {isDelivery
                        ? "Pay the rider in cash when your order arrives. Nothing is charged online."
                        : "Pay in cash at the counter when you collect your order."}
                    </p>
                  </div>
                  <b>{naira(total)}</b>
                </div>
              </div>

              <div className="checkout-call-note">
                <PhoneCall />
                <div><strong>We call to confirm</strong><p>
                  A store representative will call {form.phone ? form.phone : "the number above"} to
                  confirm your order
                  {isDelivery
                    ? deliveryConfigured
                      ? " and arrange delivery."
                      : " , confirm the delivery fee for your area, and arrange delivery."
                    : " and let you know when it is ready."}
                </p></div>
              </div>

              {status.message && (
                <div
                  className={`checkout-status ${status.type === "success" ? "is-success" : "is-error"}`}
                  role={status.type === "error" ? "alert" : "status"}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="checkout-submit"
              >
                {submitting
                  ? "Placing your order..."
                  : `Place order — pay ${naira(total)} on ${isDelivery ? "delivery" : "pickup"}`}
              </button>
            </form>

            <aside className="checkout-summary">
              <div className="checkout-panel-heading">
                <div>
                  <p>Order summary</p>
                  <h2>Your cart{totalItems > 0 ? ` (${totalItems})` : ""}</h2>
                </div>
                <div><Truck /></div>
              </div>

              {cart.length === 0 ? (
                <div className="market-empty">
                  Your cart is empty.
                </div>
              ) : (
                <div className="checkout-summary__items">
                  {cart.map((item) => (
                    <div key={item._id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} x {naira(item.price)}
                        </p>
                      </div>
                      <strong>
                        {naira(Number(item.price || 0) * Number(item.quantity || 0))}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="checkout-summary__totals">
                <div>
                  <span>Subtotal</span>
                  <span>{naira(subtotal)}</span>
                </div>
                <div>
                  <span>{isDelivery ? "Delivery" : "Store pickup"}</span>
                  <span>{deliveryFeeLabel}</span>
                </div>
                <div className="checkout-summary__total">
                  <span>Total</span>
                  <span>{naira(total)}</span>
                </div>
              </div>

              <div className="checkout-summary__note">
                <Banknote />
                <span>
                  Pay {naira(total)} in cash when you receive your order
                  {isDelivery && !deliveryConfigured ? ", plus any delivery fee the store confirms." : "."}
                </span>
              </div>
              <div className="checkout-summary__note checkout-summary__note--stock">
                <PackageCheck />
                <span>Your items are held in stock as soon as the order is placed.</span>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
