import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
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
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-blue-100 bg-blue-50 shadow-md transition-all duration-300 hover:bg-blue-100 hover:shadow-xl"
    >
    {/* Image Section */}
<div className="relative w-full h-48 sm:h-48 md:h-48 group overflow-hidden rounded-t-3xl">
  <Image
    src={productImage}
    alt={product.name}
    fill
    quality={70}
    sizes="(max-width: 768px) 100vw, 33vw"
    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
    loading="lazy"
  />
  {badge && (
    <span className="absolute top-2 left-2 px-2 py-[2px] text-[10px] sm:text-xs font-semibold tracking-wide rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20">
      {badge}
    </span>
  )}

  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 pointer-events-none rounded-t-3xl" />
</div>

{/* Details Section */}
<div className="flex flex-1 flex-col p-4 space-y-2">
  {/* Product Name */}
  <h3 className="min-h-10 text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
    {product.name}
  </h3>

  {/* Product Description */}
  {product.description && (
    <p className="text-sm text-gray-500 overflow-hidden break-words line-clamp-2 sm:line-clamp-3">
      {product.description}
    </p>
  )}

  {/* Price */}
  <div className="pt-1">
    <p className="text-base font-bold text-blue-600">
      ₦{Math.ceil(productPrice).toLocaleString()}
    </p>
    {hasStockLimit && (
      <p className={`text-xs font-semibold ${isInStock ? "text-green-600" : "text-red-500"}`}>
        {isInStock ? `${availableQuantity} available` : "Out of stock"}
      </p>
    )}
  </div>

  {/* Actions */}
  <div className="mt-auto pt-3 flex justify-between items-center gap-3">
    <Link
      href={`/products/${product._id}`}
      className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition-shadow hover:shadow-md"
    >
      View Details
    </Link>

     <button
        type="button"
        onClick={() => addToCart(product)}
        aria-label={`Add ${product.name} to cart`}
        disabled={!isInStock}
        className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition group disabled:cursor-not-allowed disabled:opacity-40">
      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">{isInStock ? "Add to Cart" : "Unavailable"}</span>
    </button>
  </div>
</div>


    </motion.div>
  );
}
