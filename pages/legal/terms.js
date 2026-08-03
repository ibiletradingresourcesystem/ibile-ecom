import Head from "next/head";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function TermsPage() {
  const { store } = useStore();
  const companyName = store?.companyName || "IbileMart Store";
  const email = store?.email || "";

  return (
    <>
      <Head><title>Terms of Service | {companyName}</title></Head>
      <div className="legal-page">
        <Link href="/" className="legal-page__back"><ChevronLeft size={16} /> Back to store</Link>
        <h1>Terms of Service</h1>
        <p className="legal-page__updated">Last updated: August 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the {companyName} website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        </section>

        <section>
          <h2>2. Account Registration</h2>
          <p>To make purchases, you may create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must provide accurate and complete information during registration.</p>
        </section>

        <section>
          <h2>3. Products and Pricing</h2>
          <p>All product listings are subject to availability. Prices are displayed in Nigerian Naira (₦) and include applicable taxes unless otherwise stated. We reserve the right to modify prices without prior notice. Product images are for illustration purposes and may differ slightly from the actual product.</p>
        </section>

        <section>
          <h2>4. Orders and Payment</h2>
          <p>Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order. Payment is required at the time of order or upon delivery as agreed. We accept bank transfers, card payments, and cash on delivery where available.</p>
        </section>

        <section>
          <h2>5. Delivery</h2>
          <p>Delivery timelines are estimates and not guaranteed. We will make reasonable efforts to deliver within the communicated timeframe. Delivery charges may apply based on location and order value.</p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>All content on this website including text, images, logos, and software is the property of {companyName} or its licensors and is protected by intellectual property laws.</p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>{companyName} shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid for the specific order in question.</p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>These Terms shall be governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of competent jurisdiction within Nigeria.</p>
        </section>

        <section>
          <h2>9. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of our services after changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>For questions about these Terms, please contact us{email ? ` at ${email}` : ""} or call our customer service line.</p>
        </section>
      </div>
    </>
  );
}
