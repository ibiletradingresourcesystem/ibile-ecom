import { useRouter } from "next/router";
import { useState } from "react";
import { ArrowLeft, MapPin, PackageCheck, PhoneCall, ShieldCheck, Truck } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalAmount, clearCart } = useCart();
  const { store } = useStore();
  const [form, setForm] = useState(initialForm);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const location = store?.locations?.find((loc) => loc._id === selectedLocation);
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
          customer: form,
          locationId: selectedLocation || undefined,
          locationName: location?.name || "",
        }),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Unable to create order.");
      }

      clearCart();
      setStatus({
        type: "success",
        message: `Order ${orderData.order.id} placed successfully. A store representative will call to confirm payment and delivery.`,
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Checkout failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                <h1>Delivery details</h1>
              </div>
              <div>
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="checkout-fields">
              <label>
                Full name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </label>
              <label>
                Phone
                <input
                  required
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>
              <label>
                City
                <input
                  required
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
              </label>
              <label className="checkout-fields__wide">
                Delivery address
                <textarea
                  required
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                />
              </label>

              {store?.locations?.length > 1 && (
                <label>
                  Preferred store location
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="">Select a location</option>
                    {store.locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}{loc.address ? ` — ${loc.address}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="checkout-call-note">
              <PhoneCall />
              <div><strong>Payment confirmation</strong><p>
                A store representative will call the customer to confirm payment, delivery, and final stock release.
              </p></div>
            </div>

            {status.message && (
              <div
                className={`checkout-status ${status.type === "success" ? "is-success" : "is-error"}`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="checkout-submit"
            >
              {submitting ? "Processing..." : "Place order"}
            </button>
          </form>

          <aside className="checkout-summary">
            <div className="checkout-panel-heading">
              <div>
                <p>Order summary</p>
                <h2>Your cart</h2>
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
                        {item.quantity} x ₦{Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <strong>
                      ₦{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            <div className="checkout-summary__totals">
              <div>
                <span>Subtotal</span>
                <span>₦{Number(totalAmount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span>Delivery</span>
                <span>Confirmed by store</span>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <span>₦{Number(totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="checkout-summary__note">
              <MapPin />
              <span>Orders are processed through the Ibile inventory workflow for fulfilment and stock control.</span>
            </div>
            <div className="checkout-summary__note checkout-summary__note--stock">
              <PackageCheck />
              <span>Stock availability is confirmed when the order is placed.</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}