import { useRouter } from "next/router";
import { useState } from "react";
import { ArrowLeft, MapPin, PackageCheck, PhoneCall, ShieldCheck, Truck } from "lucide-react";

import { useCart } from "@/context/CartContext";

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
  const [form, setForm] = useState(initialForm);
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
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
          customer: form,
        }),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Unable to create order.");
      }

      clearCart();
      setStatus({
        type: "success",
        message: `Order ${orderData.order.id} has been reserved. A store representative will call to confirm payment and delivery.`,
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Checkout failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Secure checkout</p>
                <h1 className="mt-1 text-3xl font-bold text-gray-900">Delivery details</h1>
              </div>
              <div className="rounded-full bg-blue-50 p-3 text-blue-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-gray-700">
                Full name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Phone
                <input
                  required
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                City
                <input
                  required
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700 md:col-span-2">
                Delivery address
                <textarea
                  required
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <PhoneCall className="h-4 w-4 text-blue-700" /> Payment confirmation
              </p>
              <div className="rounded-2xl border border-white bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm">
                A store representative will call the customer to confirm payment, delivery, and final stock release.
              </div>
            </div>

            {status.message && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-green-500 to-green-700 px-5 py-3 font-bold text-white shadow-lg transition hover:from-green-600 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Processing..." : "Place reserved order"}
            </button>
          </form>

          <aside className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Order summary</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">Your cart</h2>
              </div>
              <Truck className="h-6 w-6 text-blue-700" />
            </div>

            {cart.length === 0 ? (
              <div className="rounded-2xl bg-blue-50 p-6 text-center text-sm font-semibold text-gray-600">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-start justify-between gap-3 rounded-2xl bg-gray-50 p-4">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.quantity} x ₦{Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-blue-700">
                      ₦{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-gray-200 pt-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₦{Number(totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span>Confirmed by store</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>₦{Number(totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
              <span>Orders are written into the shared Ibile inventory/POS workflow for fulfilment and stock control.</span>
            </div>
            <div className="mt-3 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm text-gray-600">
              <PackageCheck className="mt-0.5 h-5 w-5 flex-none text-green-700" />
              <span>Stock is reserved at checkout and finalized later by the contact-call staff, POS, or admin workflow.</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}