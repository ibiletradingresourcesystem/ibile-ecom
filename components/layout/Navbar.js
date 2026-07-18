"use client";

import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import CartSidebar from "@/components/cart/CartSidebar";

export default function Nav() {
  const { cart } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-black/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-all"
          >
            <div className="relative w-10 h-10 bg-gray-500 rounded-full p-3 shadow-inner">
              <Image
                src="/images/Logo.png"
                alt="Ibile Store Logo"
                fill
                className="object-cover rounded-full"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 text-transparent bg-clip-text dark:from-blue-300 dark:to-teal-200 drop-shadow-sm">
              Ibile Store
            </span>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center space-x-5">
            <button
              type="button"
              aria-label="Search products"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Account"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open cart"
              className="relative text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-red-500 text-white rounded-full px-1.5 font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar + Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="ml-auto relative z-50">
            <CartSidebar closeSidebar={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
