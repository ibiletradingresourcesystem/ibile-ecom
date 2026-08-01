import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { store } = useStore();

  const storeName = store?.storeName || store?.companyName || "IbileMart Store";
  const phone = store?.storePhone || "";
  const address = store?.companyAddress || "";

  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div>
          <strong>{storeName}</strong>
          <p>Everyday essentials with live inventory and direct customer support.</p>
          {address && <p className="text-sm opacity-75">{address}</p>}
        </div>
        <div><strong>Shop</strong><Link href="/products">All products</Link><Link href="/checkout">Your cart</Link></div>
        <div>
          <strong>Need help?</strong>
          {phone && <a href={`tel:${phone}`}>{phone}</a>}
          <span>Payment and delivery are confirmed by phone.</span>
        </div>
      </div>
      <div className="store-footer__bottom">&copy; {currentYear} {storeName}. All rights reserved.</div>
    </footer>
  );
}
