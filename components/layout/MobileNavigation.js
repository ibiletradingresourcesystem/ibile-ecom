import Link from "next/link";
import { Grid2X2, Home, Phone, ShoppingCart } from "lucide-react";
import { useRouter } from "next/router";

import { useCart } from "@/context/CartContext";

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: Grid2X2 },
  { href: "/checkout", label: "Cart", icon: ShoppingCart, cart: true },
];

export default function MobileNavigation() {
  const router = useRouter();
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

  return (
    <nav className="mobile-navigation" aria-label="Mobile navigation">
      {navigationItems.map(({ href, label, icon: Icon, cart: isCart }) => {
        const active = href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

        return (
          <Link key={href} href={href} className={`mobile-navigation__item ${active ? "is-active" : ""}`}>
            <span className="mobile-navigation__icon">
              <Icon aria-hidden="true" />
              {isCart && cartCount > 0 && <span className="mobile-navigation__badge">{cartCount}</span>}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
      <a href="tel:02018883300" className="mobile-navigation__item">
        <span className="mobile-navigation__icon"><Phone aria-hidden="true" /></span>
        <span>Call</span>
      </a>
    </nav>
  );
}