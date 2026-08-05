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
          className="cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <div className="cart-drawer__header">
            <h2>Your cart</h2>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="cart-drawer__empty">
            <div>
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3>Your cart is empty</h3>
            <p>
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
          className="cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <div className="cart-drawer__header">
            <div><p>Shopping bag</p><h2>Your cart <span>({cart.length})</span></h2></div>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ul className="cart-drawer__items">
            {cart.map((item) => (
              <li
                key={item._id}
                className="cart-drawer__item"
              >
                <div className="cart-drawer__item-info">
                  <strong>
                    {item.name}
                  </strong>
                  <span>₦{Number(item.price || 0).toLocaleString()} each</span>
                  <b>₦{(Number(item.price || 0) * item.quantity).toLocaleString()}</b>
                </div>
                <div className="cart-drawer__item-actions">
                  <div className="cart-quantity">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                      disabled={Number.isFinite(getItemLimit(item)) && item.quantity >= getItemLimit(item)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item._id)}
                    className="cart-drawer__remove"
                  >
                    <Trash2 /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-drawer__summary">
            <p>Payment and delivery will be confirmed by phone.</p>
            <div>
              <span>Total</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="cart-drawer__checkout"
            >
              Checkout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
