import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getCategoryIcon } from "@/lib/categoryIcons";



export default function ProductCard({ product, badge }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  // The wishlist lives in AuthContext so the card and the account page agree on
  // what is saved and on the shape it is stored in.
  const { isInWishlist, toggleWishlist } = useAuth();
  const wishlisted = isInWishlist(product._id);
  const productImage =
    product.images && product.images[0]
      ? product.images[0]
      : product.image || null;
  const productPrice = Number(product.price || 0);
  const CategoryIcon = getCategoryIcon(product.categoryIcon, product.category);
  const availableQuantity = Number(product.availableQuantity);
  const hasStockLimit = Number.isFinite(availableQuantity) && availableQuantity < 999999;
  const isInStock = product.isInStock !== false && (!hasStockLimit || availableQuantity > 0);

  const cartItem = cart.find((item) => item._id === product._id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }, [addToCart, product]);

  const handleIncrease = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, cartQty + 1);
  }, [updateQuantity, product._id, cartQty]);

  const handleDecrease = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty <= 1) {
      removeFromCart(product._id);
    } else {
      updateQuantity(product._id, cartQty - 1);
    }
  }, [removeFromCart, updateQuantity, product._id, cartQty]);

  const handleToggleWishlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }, [toggleWishlist, product]);

  
  return (
    <article className="market-product-card">
      <Link href={`/products/${product._id}`} className="market-product-card__image">
        {productImage && !imageFailed ? (
          <Image
            src={productImage}
            alt={product.name}
            fill
            quality={75}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
            className="object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="market-product-card__placeholder">
            <CategoryIcon aria-hidden="true" />
          </span>
        )}
        {badge && <span className="market-product-card__badge">{badge}</span>}
        <button
          type="button"
          className={`market-product-card__wishlist ${wishlisted ? "is-active" : ""}`}
          onClick={handleToggleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart />
        </button>
      </Link>
      <div className="market-product-card__body">
        <p className="market-product-card__category">{typeof product.category === "string" ? product.category : "Product"}</p>
        <Link href={`/products/${product._id}`} className="market-product-card__name">{product.name}</Link>
        <div className="market-product-card__footer">
          <div>
            <strong>₦{Math.ceil(productPrice).toLocaleString()}</strong>
            {hasStockLimit && <small className={isInStock ? "is-available" : "is-unavailable"}>{isInStock ? `${availableQuantity} left` : "Out of stock"}</small>}
          </div>
          {cartQty > 0 ? (
            <div className="market-product-card__qty">
              <button type="button" onClick={handleDecrease} aria-label="Decrease quantity">
                <Minus />
              </button>
              <span>{cartQty}</span>
              <button type="button" onClick={handleIncrease} aria-label="Increase quantity" disabled={hasStockLimit && cartQty >= availableQuantity}>
                <Plus />
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`} disabled={!isInStock}>
              <Plus />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
