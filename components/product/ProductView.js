import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";
import { useCart } from "@/context/CartContext";

export default function ProductView({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const availableQuantity = Number(product.availableQuantity);
  const hasStockLimit = Number.isFinite(availableQuantity) && availableQuantity < 999999;
  const isInStock = product.isInStock !== false && (!hasStockLimit || availableQuantity > 0);

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
      : product.image || "/images/productImaHolder.jpg";

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/50 md:p-8">
        {/* Product Image */}
        <div className="relative">
          <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg bg-white/5 backdrop-blur-lg border border-gray-200/40">
            <Image
              src={productImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          {/* Category Badge */}
          {product.category && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow">
              {product.category}
            </span>
          )}

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900 leading-snug">
            {product.name}
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-base leading-relaxed">
            {product.description || "No description available."}
          </p>

          {/* Price */}
          <div className="text-2xl font-bold text-blue-600">
            ₦{Math.ceil(product.price).toLocaleString()}
          </div>

          {hasStockLimit && (
            <p className={`text-sm font-semibold ${isInStock ? "text-green-600" : "text-red-500"}`}>
              {isInStock ? `${availableQuantity} available for online order` : "Out of stock"}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleDecrease}
              aria-label="Decrease quantity"
              disabled={!isInStock}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 h-9 flex text-gray-900 items-center justify-center rounded-full bg-gray-100 font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-label="Increase quantity"
              disabled={!isInStock || (hasStockLimit && quantity >= availableQuantity)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 overflow-hidden font-semibold rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShoppingCart className="h-5 w-5" />
            {isInStock ? (added ? "Added to Cart" : `Add ${quantity} to Cart`) : "Unavailable"}
          </button>

          {/* Share Buttons */}
          <div className="pt-4 border-t border-gray-200">
            <p className="font-semibold mb-2 text-gray-800 text-sm">
              Share this product:
            </p>
            <div className="flex space-x-3">
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
