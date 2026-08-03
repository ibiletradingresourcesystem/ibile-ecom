import Head from "next/head";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function PrivacyPage() {
  const { store } = useStore();
  const companyName = store?.companyName || "IbileMart Store";
  const email = store?.email || "";

  return (
    <>
      <Head><title>Privacy Policy | {companyName}</title></Head>
      <div className="legal-page">
        <Link href="/" className="legal-page__back"><ChevronLeft size={16} /> Back to store</Link>
        <h1>Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: August 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly: name, email address, phone number, delivery address, and payment details when you make a purchase or create an account. We also collect usage data such as pages visited, products viewed, and device information.</p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Processing and fulfilling your orders</li>
            <li>Communicating order status and delivery updates</li>
            <li>Providing customer support</li>
            <li>Personalizing your shopping experience</li>
            <li>Sending promotional communications (with your consent)</li>
            <li>Improving our services and website functionality</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing</h2>
          <p>We do not sell your personal data. We may share information with:</p>
          <ul>
            <li>Delivery partners to fulfil your orders</li>
            <li>Payment processors to handle transactions</li>
            <li>Service providers who assist in operating our platform</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction. Passwords are stored using industry-standard encryption.</p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>We use essential cookies to maintain your session and cart. We may use analytics cookies to understand how visitors interact with our site. You can control cookie preferences through your browser settings.</p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>We retain your data for as long as your account is active or as needed to provide services. Order records are kept for legal and accounting purposes as required by Nigerian law.</p>
        </section>

        <section>
          <h2>8. Children&apos;s Privacy</h2>
          <p>Our services are not directed to children under 13. We do not knowingly collect personal data from children.</p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>For privacy inquiries or to exercise your rights, contact us{email ? ` at ${email}` : ""} or call our customer service line.</p>
        </section>
      </div>
    </>
  );
}
