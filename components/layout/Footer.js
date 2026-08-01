import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div><strong>Ibile Mart</strong><p>Everyday essentials with live inventory and direct customer support.</p></div>
        <div><strong>Shop</strong><Link href="/products">All products</Link><Link href="/checkout">Your cart</Link></div>
        <div><strong>Need help?</strong><a href="tel:02018883300">0201 888 3300</a><span>Payment and delivery are confirmed by phone.</span></div>
      </div>
      <div className="store-footer__bottom">&copy; {currentYear} Ibile Mart Store. All rights reserved.</div>
    </footer>
  );
}
