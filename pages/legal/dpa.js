import Head from "next/head";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function DPAPage() {
  const { store } = useStore();
  const companyName = store?.companyName || "IbileMart Store";
  const email = store?.email || "";

  return (
    <>
      <Head><title>Data Processing Agreement | {companyName}</title></Head>
      <div className="legal-page">
        <Link href="/" className="legal-page__back"><ChevronLeft size={16} /> Back to store</Link>
        <h1>Data Processing Agreement</h1>
        <p className="legal-page__updated">Last updated: August 2026</p>

        <section>
          <h2>1. Purpose</h2>
          <p>This Data Processing Agreement (DPA) outlines the terms under which {companyName} processes personal data on behalf of customers in compliance with the Nigeria Data Protection Regulation (NDPR) and other applicable laws.</p>
        </section>

        <section>
          <h2>2. Definitions</h2>
          <ul>
            <li><strong>Data Controller:</strong> The customer whose personal data is being processed</li>
            <li><strong>Data Processor:</strong> {companyName}, which processes data on behalf of the controller</li>
            <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
          </ul>
        </section>

        <section>
          <h2>3. Scope of Processing</h2>
          <p>We process personal data solely for:</p>
          <ul>
            <li>Order fulfillment and delivery coordination</li>
            <li>Payment processing and invoicing</li>
            <li>Customer communication and support</li>
            <li>Legal and regulatory compliance</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security Measures</h2>
          <p>We implement the following measures to protect personal data:</p>
          <ul>
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Secure password storage with industry-standard hashing</li>
            <li>Access controls limiting data access to authorized personnel</li>
            <li>Regular security assessments and updates</li>
            <li>Secure cloud infrastructure with data backup</li>
          </ul>
        </section>

        <section>
          <h2>5. Sub-processors</h2>
          <p>We may engage sub-processors for specific services (payment gateways, hosting providers, delivery partners). All sub-processors are bound by equivalent data protection obligations.</p>
        </section>

        <section>
          <h2>6. Data Subject Rights</h2>
          <p>We assist in fulfilling data subject requests including access, rectification, erasure, and data portability in accordance with applicable regulations.</p>
        </section>

        <section>
          <h2>7. Data Breach Notification</h2>
          <p>In the event of a personal data breach, we will notify affected individuals and relevant authorities within 72 hours of becoming aware of the breach, where required by law.</p>
        </section>

        <section>
          <h2>8. Data Retention and Deletion</h2>
          <p>Personal data is retained only for the duration necessary to fulfill the purposes outlined in this agreement. Upon account deletion or request, personal data will be permanently removed within 30 days, except where retention is required by law.</p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>For DPA inquiries, contact our Data Protection Officer{email ? ` at ${email}` : ""}.</p>
        </section>
      </div>
    </>
  );
}
