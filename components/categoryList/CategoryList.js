import { useEffect, useState } from "react";
import ProductByCategory from "../product/ProductByCategory";

export default function CategoryList({
  groupByCategory = false,
  category = null,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Unable to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load category products right now.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const normalizeCategory = (value) => String(value || "").trim().toLowerCase();
  const categoryFilter = normalizeCategory(category);
  const filteredProducts = category
    ? products.filter((product) => normalizeCategory(product.category) === categoryFilter)
    : products;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-sky-50 via-white to-sky-100">
        <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-10">
          Products by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-3xl border border-blue-100 bg-blue-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Categories unavailable</h2>
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-sky-50 via-white to-sky-100">
      <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-10">
        Products by Category
      </h2>
      <ProductByCategory products={filteredProducts} />
    </div>
  );
}
