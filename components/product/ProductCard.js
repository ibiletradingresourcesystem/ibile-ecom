import Link from "next/link";
import Image from "next/image";
import { Check, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getCategoryIcon } from "@/lib/categoryIcons";

export default function ProductCard({ product, badge, priority = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  // The wishlist lives in AuthContext so the card and the account page agree on
  // what is saved and on the shape it is stored in.
  const { isInWishlist, toggleWishlist } = useAuth();
  const wishlisted = isInWishlist(product._id);

  const productImage = product.images?.[0] || product.image || null;
  const productPrice = Number(product.price || 0);
  const CategoryIcon = getCategoryIcon(product.categoryIcon, product.category);

  const availableQuantity = Number(product.availableQuantity);
  const hasStockLimit = Number.isFinite(availableQuantity) && availableQuantity < 999999;
  const isInStock = product.isInStock !== false && (!hasStockLimit || availableQuantity > 0);
  const isLowStock = hasStockLimit && availableQuantity > 0 && availableQuantity <= 5;

  const cartItem = cart.find((item) => item._id === product._id);
  const cartQty = cartItem?.quantity || 0;
  const atStockLimit = hasStockLimit && cartQty >= availableQuantity;

  // Every control sits inside a card-wide <Link>, so each one has to stop the
  // click from navigating to the product page.
  const withoutNavigation = (handler) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  };

  const handleAdd = useCallback(() => addToCart(product, 1), [addToCart, product]);

  const handleIncrease = useCallback(() => {
    updateQuantity(product._id, cartQty + 1);
  }, [updateQuantity, product._id, cartQty]);

  const handleDecrease = useCallback(() => {
    if (cartQty <= 1) {
      removeFromCart(product._id);
    } else {
      updateQuantity(product._id, cartQty - 1);
    }
  }, [removeFromCart, updateQuantity, product._id, cartQty]);

  return (
    <article className={`market-product-card ${!isInStock ? "is-sold-out" : ""}`}>
      <Link href={`/products/${product._id}`} className="market-product-card__image">
        {productImage && !imageFailed ? (
          <Image
            src={productImage}
            alt={product.name}
            fill
            quality={70}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
            className="object-contain"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="market-product-card__placeholder">
            <CategoryIcon aria-hidden="true" />
          </span>
        )}

        {badge && isInStock && <span className="market-product-card__badge">{badge}</span>}
        {!isInStock && <span className="market-product-card__badge is-sold-out">Sold out</span>}
      </Link>

      <button
        type="button"
        className={`market-product-card__wishlist ${wishlisted ? "is-active" : ""}`}
        onClick={withoutNavigation(() => toggleWishlist(product))}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} for later`}
      >
        <Heart />
      </button>

      <div className="market-product-card__body">
        <p className="market-product-card__category">
          {typeof product.category === "string" ? product.category : "Product"}
        </p>

        <Link href={`/products/${product._id}`} className="market-product-card__name">
          {product.name}
        </Link>

        <div className="market-product-card__footer">
          <div className="market-product-card__price">
            <strong>&#8358;{Math.ceil(productPrice).toLocaleString()}</strong>
            {hasStockLimit && (
              <small className={isInStock ? (isLowStock ? "is-low" : "is-available") : "is-unavailable"}>
                {isInStock ? `${availableQuantity} left` : "Out of stock"}
              </small>
            )}
          </div>

          <div className="market-product-card__action">
            {!isInStock ? (
              <button type="button" className="market-product-card__add" disabled>
                Sold out
              </button>
            ) : cartQty > 0 ? (
              <div className="market-product-card__qty" role="group" aria-label={`${product.name} quantity`}>
                <button
                  type="button"
                  onClick={withoutNavigation(handleDecrease)}
                  aria-label={cartQty <= 1 ? `Remove ${product.name} from cart` : `Decrease ${product.name} quantity`}
                >
                  <Minus aria-hidden="true" />
                </button>
                <span aria-live="polite">{cartQty}</span>
                <button
                  type="button"
                  onClick={withoutNavigation(handleIncrease)}
                  disabled={atStockLimit}
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="market-product-card__add"
                onClick={withoutNavigation(handleAdd)}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart aria-hidden="true" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>

        {cartQty > 0 && (
          <p className="market-product-card__in-cart">
            <Check aria-hidden="true" /> In cart
          </p>
        )}
      </div>
    </article>
  );
}
