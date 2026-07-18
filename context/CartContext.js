import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

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
    const loadCart = async () => {
      try {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (err) {
        console.error("Unable to load cart:", err);
      } finally {
        setCartLoaded(true);
      }
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, cartLoaded]);

  const addToCart = (product, quantity = 1) => {
    const maxQuantity = getMaxQuantity(product);
    const safeQuantity = normalizeQuantity(quantity, maxQuantity);

    if (safeQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((p) => p._id === product._id);
      if (existing) {
        const existingMaxQuantity = getMaxQuantity(existing);
        return prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
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
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((p) => p._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((p) =>
        p._id === productId
          ? { ...p, quantity: normalizeQuantity(quantity, getMaxQuantity(p)) }
          : p
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * normalizeQuantity(item.quantity, getMaxQuantity(item)),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
