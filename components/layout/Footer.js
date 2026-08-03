import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { store } = useStore();

  const phone = store?.storePhone || "";
  const address = store?.companyAddress || "";
  const email = store?.email || "";

  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div>
          <strong>IbileMart Store</strong>
          <p>Everyday essentials with live inventory and direct customer support.</p>
          {address && <p className="text-sm opacity-75">{address}</p>}
        </div>
        <div>
          <strong>Shop</strong>
          <Link href="/products">All products</Link>
          <Link href="/checkout">Your cart</Link>
          <Link href="/account">My account</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <Link href="/legal/terms">Terms of Service</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/dpa">Data Processing Agreement</Link>
          <Link href="/legal/refund">Refund Policy</Link>
        </div>
        <div>
          <strong>Need help?</strong>
          {phone && <a href={`tel:${phone}`}>{phone}</a>}
          {email && <a href={`mailto:${email}`}>{email}</a>}
          <span>Payment and delivery are confirmed by phone.</span>
        </div>
      </div>
      <div className="store-footer__bottom">&copy; {currentYear} IbileMart Store. All rights reserved.</div>
    </footer>
  );
}
