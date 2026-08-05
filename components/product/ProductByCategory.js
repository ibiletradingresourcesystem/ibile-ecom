import React from "react";
import ProductCard from "./ProductCard";

export default function ProductByCategory({ products }) {
  if (!products || products.length === 0) {
    return (
      <p className="product-group__empty">
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
    <div className="product-group-list">
      {Object.keys(grouped).map((category) => (
        <section key={category} className="product-group">
          <div className="product-group__header">
            <h3>{category}</h3>
            <span>{grouped[category].length} items</span>
          </div>

          <div className="product-group__track">
            {grouped[category].slice(0, 10).map((product) => (
              <div key={product._id} className="product-group__item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

}
