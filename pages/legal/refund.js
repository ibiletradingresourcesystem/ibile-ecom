import Head from "next/head";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function RefundPage() {
  const { store } = useStore();
  const companyName = store?.companyName || "IbileMart Store";
  const email = store?.email || "";
  const phone = store?.storePhone || "";

  return (
    <>
      <Head><title>Refund Policy | {companyName}</title></Head>
      <div className="legal-page">
        <Link href="/" className="legal-page__back"><ChevronLeft size={16} /> Back to store</Link>
        <h1>Refund &amp; Return Policy</h1>
        <p className="legal-page__updated">Last updated: August 2026</p>

        <section>
          <h2>1. Return Eligibility</h2>
          <p>Products may be returned within 24 hours of delivery if:</p>
          <ul>
            <li>The item is damaged or defective</li>
            <li>The wrong item was delivered</li>
            <li>The item is expired or near expiry (for perishable goods)</li>
          </ul>
          <p>The following items cannot be returned:</p>
          <ul>
            <li>Perishable goods that have been opened or consumed</li>
            <li>Personal care items that have been opened</li>
            <li>Items purchased on clearance or final sale</li>
          </ul>
        </section>

        <section>
          <h2>2. How to Request a Return</h2>
          <p>Contact our team{phone ? ` at ${phone}` : ""}{email ? ` or email ${email}` : ""} within 24 hours of receiving your order. Provide your order number and a description or photo of the issue.</p>
        </section>

        <section>
          <h2>3. Refund Process</h2>
          <p>Once a return is approved:</p>
          <ul>
            <li>Refunds are processed within 3–5 business days</li>
            <li>Refunds are issued to the original payment method</li>
            <li>For cash-on-delivery orders, refunds are made via bank transfer</li>
          </ul>
        </section>

        <section>
          <h2>4. Exchanges</h2>
          <p>We offer exchanges for defective or incorrect items subject to stock availability. If the replacement item is unavailable, a full refund will be issued.</p>
        </section>

        <section>
          <h2>5. Delivery Issues</h2>
          <p>If your order is not delivered within the communicated timeframe, please contact us. We will investigate and either expedite delivery or offer a full refund.</p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p>For refund or return inquiries, reach us{phone ? ` at ${phone}` : ""}{email ? ` or ${email}` : ""}. Our team is available during business hours to assist you.</p>
        </section>
      </div>
    </>
  );
}
