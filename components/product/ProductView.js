import { useState } from "react";
import Image from "next/image";
import { Minus, PhoneCall, Plus, ShoppingCart } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";
import { useCart } from "@/context/CartContext";
import { getCategoryIcon } from "@/lib/categoryIcons";

export default function ProductView({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { addToCart } = useCart();
  const availableQuantity = Number(product.availableQuantity);
  const hasStockLimit = Number.isFinite(availableQuantity) && availableQuantity < 999999;
  const isInStock = product.isInStock !== false && (!hasStockLimit || availableQuantity > 0);
  const CategoryIcon = getCategoryIcon(product.categoryIcon, product.category);

  const handleIncrease = () =>
    setQuantity((prev) => {
      if (hasStockLimit) return Math.min(prev + 1, Math.max(1, availableQuantity));
      return prev + 1;
    });
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const handleAddToCart = () => {
    if (!isInStock) return;
    addToCart(product, quantity);
    setAdded(true);
  };

  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const productImage =
    product.images && product.images[0]
      ? product.images[0]
      : product.image || null;

  return (
    <section className="product-detail">
      <div className="product-detail__layout">
        <div className="product-detail__image">
          {productImage && !imageFailed ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="market-product-card__placeholder" style={{ borderRadius: 12 }}>
              <CategoryIcon style={{ width: 64, height: 64 }} aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="product-detail__content">
          {product.category && (
            <p className="product-detail__category">{product.category}</p>
          )}
          <h1>{product.name}</h1>
          <p className="product-detail__description">{product.description || "Product details are available from our store team."}</p>
          <div className="product-detail__price">₦{Math.ceil(product.price).toLocaleString()}</div>

          {hasStockLimit && (
            <p className={`product-detail__stock ${isInStock ? "is-available" : "is-unavailable"}`}>
              {isInStock ? `${availableQuantity} available for online order` : "Out of stock"}
            </p>
          )}

          <div className="product-detail__purchase">
            <div className="cart-quantity">
            <button
              type="button"
              onClick={handleDecrease}
              aria-label="Decrease quantity"
              disabled={!isInStock}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span>
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-label="Increase quantity"
              disabled={!isInStock || (hasStockLimit && quantity >= availableQuantity)}
            >
              <Plus className="h-4 w-4" />
            </button>
            </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock}
            className="product-detail__add"
          >
            <ShoppingCart className="h-5 w-5" />
            {isInStock ? (added ? "Added to Cart" : `Add ${quantity} to Cart`) : "Unavailable"}
          </button>
          </div>

          <div className="product-detail__call"><PhoneCall /><span><strong>Order confirmation by phone</strong><small>Our team confirms payment, final stock and delivery after checkout.</small></span></div>

          <div className="product-detail__share">
            <p>Share this product</p>
            <div>
              <FacebookShareButton url={productUrl} quote={product.name}>
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <TwitterShareButton url={productUrl} title={product.name}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <WhatsappShareButton url={productUrl} title={product.name}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
