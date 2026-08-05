import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function StatusPage({ code, title, message }) {
  return (
    <section className="status-page" aria-labelledby="status-title">
      <div className="status-page__mark" aria-hidden="true">{code}</div>
      <p>IbileMart Store</p>
      <h1 id="status-title">{title}</h1>
      <span>{message}</span>
      <div className="status-page__actions">
        <Link href="/" className="status-page__primary"><Home /> Go home</Link>
        <Link href="/products" className="status-page__secondary"><ArrowLeft /> Browse products</Link>
      </div>
    </section>
  );
}