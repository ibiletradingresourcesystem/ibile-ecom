"use client";

import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/router";

export default function CartSidebar({ closeSidebar = () => {} }) {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const router = useRouter();

  const getItemLimit = (item) => {
    const availableQuantity = Number(item.availableQuantity);
    return Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? Math.floor(availableQuantity)
      : Number.POSITIVE_INFINITY;
  };

  const handleQuantityChange = (productId, quantity) => {
    updateQuantity(productId, quantity);
  };

  const handleCheckout = () => {
    closeSidebar();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {cart.length === 0 ? (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col z-50"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Cart
            </h2>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close cart"
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Your cart is empty
            </h3>
            <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              Add products from the store and they will appear here ready for checkout.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Cart
            </h2>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close cart"
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <ul className="flex-1 overflow-y-auto space-y-4">
            {cart.map((item) => (
              <li
                key={item._id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col flex-1 pr-2">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ₦{Number(item.price || 0).toLocaleString()} x {item.quantity} = ₦
                    {(Number(item.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center rounded-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-blue-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                      disabled={Number.isFinite(getItemLimit(item)) && item.quantity >= getItemLimit(item)}
                      className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 transition flex items-center gap-1 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Total & Checkout */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white mb-4">
              <span>Total:</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all"
            >
              Checkout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
