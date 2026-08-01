import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";



export default function ProductCard({ product, badge }) {
  const { addToCart } = useCart();
  const productImage =
    product.images && product.images[0]
      ? product.images[0]
      : product.image || "/images/productImaHolder.jpg";
  const productPrice = Number(product.price || 0);
  const availableQuantity = Number(product.availableQuantity);
  const hasStockLimit = Number.isFinite(availableQuantity) && availableQuantity < 999999;
  const isInStock = product.isInStock !== false && (!hasStockLimit || availableQuantity > 0);

  
  return (
    <article className="market-product-card">
      <Link href={`/products/${product._id}`} className="market-product-card__image">
        <Image
          src={productImage}
          alt={product.name}
          fill
          quality={75}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
          className="object-contain"
        />
        {badge && <span className="market-product-card__badge">{badge}</span>}
      </Link>
      <div className="market-product-card__body">
        <p className="market-product-card__category">{typeof product.category === "string" ? product.category : "Product"}</p>
        <Link href={`/products/${product._id}`} className="market-product-card__name">{product.name}</Link>
        <div className="market-product-card__footer">
          <div>
            <strong>₦{Math.ceil(productPrice).toLocaleString()}</strong>
            {hasStockLimit && <small className={isInStock ? "is-available" : "is-unavailable"}>{isInStock ? `${availableQuantity} left` : "Out of stock"}</small>}
          </div>
          <button type="button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`} disabled={!isInStock}>
            <Plus />
          </button>
        </div>
      </div>
    </article>
  );
}
