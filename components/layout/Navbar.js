"use client";

import Link from "next/link";
import { Menu, Phone, Search, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { useState } from "react";
import CartSidebar from "@/components/cart/CartSidebar";

export default function Nav() {
  const router = useRouter();
  const { cart } = useCart();
  const { store } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const storePhone = store?.storePhone || "";

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  return (
    <>
      <header className="store-header">
        <div className="store-header__main">
          <div className="store-header__inner">
            <button type="button" className="store-header__menu" aria-label="Browse products" onClick={() => router.push("/products")}>
              <Menu />
            </button>
            <Link href="/" className="store-header__brand" aria-label="Ibile Mart home">
              <span className="store-header__logo">
              <Image
                src="/images/Logo.png"
                  alt=""
                fill
                  sizes="44px"
                  className="object-cover"
              />
              </span>
              <span className="store-header__brand-name">IbileMart Store</span>
            </Link>

            <form className="store-search" role="search" onSubmit={handleSearch}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products, brands and categories"
                aria-label="Search products"
              />
              <button type="submit">Search</button>
            </form>

            <div className="store-header__actions">
              {storePhone && (
                <a href={`tel:${storePhone}`} className="store-header__action store-header__call">
                  <Phone />
                  <span><small>Call to order</small>{storePhone}</span>
                </a>
              )}
              <button type="button" onClick={() => setSidebarOpen(true)} className="store-header__action store-header__cart" aria-label="Open cart">
                <span className="store-header__cart-icon">
                  <ShoppingCart />
                  {cartCount > 0 && <span>{cartCount}</span>}
                </span>
                <span>Cart</span>
              </button>
            </div>
          </div>

          <form className="store-search store-search--mobile" role="search" onSubmit={handleSearch}>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search on IbileMart Store"
              aria-label="Search products"
            />
          </form>
        </div>
        <div className="store-header__strip">
          <div className="store-header__strip-inner">
            {storePhone && <span>Call to order: {storePhone}</span>}
            <span className="store-header__strip-message">Everyday essentials, reliable stock, straightforward ordering.</span>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[70] flex">
          <button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="ml-auto relative z-10">
            <CartSidebar closeSidebar={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
