import React from "react";
import ProductCard from "./ProductCard"; // adjust path if needed

export default function ProductByCategory({ products }) {
  if (!products || products.length === 0) {
    return (
      <p className="text-center text-gray-400 text-lg mt-10">
        No products available.
      </p>
    );
  }

  // Group products by category
  const grouped = products.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  return (
  <div className="space-y-16">
    {Object.keys(grouped).map((category) => (
      <section key={category} className="relative">
        {/* Category Header */}
        <div className="flex items-center mb-5">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight relative z-10">
            {category}
          </h3>
          <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-blue-500 via-purple-400 to-pink-300 rounded-full opacity-50" />
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex space-x-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-200 hover:scrollbar-thumb-blue-600 transition-all">
          {grouped[category]
            .slice(0, 10) // limit to 10 products
            .map((product) => (
              <div
                key={product._id}
                className="flex-none w-44 sm:w-52 transition-transform duration-300 hover:scale-105"
              >
                <ProductCard product={product} />
              </div>
            ))}
        </div>

        {/* Optional shimmer or gradient overlay at scroll end */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-white/80 to-transparent" />
      </section>
    ))}
  </div>
);

}
