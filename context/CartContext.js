import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "cart";

const getMaxQuantity = (product) => {
  const availableQuantity = Number(product?.availableQuantity);

  return Number.isFinite(availableQuantity) && availableQuantity >= 0
    ? Math.floor(availableQuantity)
    : Number.POSITIVE_INFINITY;
};

const normalizeQuantity = (quantity, maxQuantity = Number.POSITIVE_INFINITY) => {
  const parsedQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? Math.floor(parsedQuantity)
    : 1;

  if (Number.isFinite(maxQuantity)) {
    return Math.max(0, Math.min(safeQuantity, Math.floor(maxQuantity)));
  }

  return safeQuantity;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((item) => item && item._id));
        }
      }
    } catch (err) {
      console.error("Unable to load cart:", err);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      // Private browsing or a full quota should never break checkout.
      console.error("Unable to save cart:", err);
    }
  }, [cart, cartLoaded]);

  const addToCart = useCallback((product, quantity = 1) => {
    const maxQuantity = getMaxQuantity(product);
    const safeQuantity = normalizeQuantity(quantity, maxQuantity);

    if (safeQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((p) => p._id === product._id);
      if (existing) {
        const existingMaxQuantity =
          product?.availableQuantity !== undefined ? maxQuantity : getMaxQuantity(existing);
        return prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
                // Refresh price and stock from the product just added, so a
                // long-lived cart does not keep quoting a stale price.
                price: Number(product.price ?? p.price ?? 0),
                availableQuantity: product.availableQuantity ?? p.availableQuantity,
                quantity: normalizeQuantity(
                  normalizeQuantity(p.quantity) + safeQuantity,
                  existingMaxQuantity
                ),
              }
            : p
        );
      }
      return [...prev, { ...product, quantity: safeQuantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCart((prev) =>
      prev.flatMap((p) => {
        if (p._id !== productId) return [p];

        const nextQuantity = normalizeQuantity(quantity, getMaxQuantity(p));
        // Stepping below one removes the line rather than leaving a zero row.
        return nextQuantity > 0 ? [{ ...p, quantity: nextQuantity }] : [];
      })
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /**
   * Reconciles the locally stored cart with a server validation response so the
   * customer sees live prices and stock instead of whatever was cached in this
   * browser, possibly weeks ago.
   */
  const syncCartWithServer = useCallback((validatedItems) => {
    if (!Array.isArray(validatedItems)) return;

    const byId = new Map(validatedItems.map((item) => [String(item.productId), item]));

    setCart((prev) =>
      prev.flatMap((item) => {
        const validated = byId.get(String(item._id));
        if (!validated) return [item];
        if (validated.removed || validated.quantity <= 0) return [];

        return [
          {
            ...item,
            name: validated.name ?? item.name,
            price: validated.price ?? item.price,
            quantity: validated.quantity,
            availableQuantity: validated.availableQuantity ?? item.availableQuantity,
            isInStock: validated.isInStock ?? item.isInStock,
          },
        ];
      })
    );
  }, []);

  const { totalAmount, totalItems } = useMemo(
    () =>
      cart.reduce(
        (totals, item) => {
          const quantity = normalizeQuantity(item.quantity, getMaxQuantity(item));
          totals.totalAmount += Number(item.price || 0) * quantity;
          totals.totalItems += quantity;
          return totals;
        },
        { totalAmount: 0, totalItems: 0 }
      ),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartLoaded,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCartWithServer,
      totalAmount,
      totalItems,
    }),
    [
      cart,
      cartLoaded,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCartWithServer,
      totalAmount,
      totalItems,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
