import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import ProductByCategory from "./ProductByCategory";

export default function ProductList({
  groupByCategory = false,
  category = null,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/webproducts");
        if (!res.ok) throw new Error("Unable to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("We could not load products right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, groupByCategory]);

  const normalizeCategory = (value) => String(value || "").trim().toLowerCase();
  const categoryFilter = normalizeCategory(category);

  const filteredProducts = category
    ? products.filter((product) => {
        const productCategory = product.category;
        if (typeof productCategory === "object" && productCategory !== null) {
          return [productCategory._id, productCategory.name].some(
            (value) => normalizeCategory(value) === categoryFilter
          );
        }

        return normalizeCategory(productCategory) === categoryFilter;
      })
    : products;

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
        <div className="relative max-w-7xl mx-auto p-6">
          <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-12 drop-shadow-sm">
            Loading Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-3xl border border-blue-100 bg-blue-50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Products unavailable</h2>
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  // Grouped view
  if (groupByCategory) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-sky-50 via-white to-sky-100 min-h-screen">
        <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-10">
          {category ? `${category} Products` : "Products by Category"}
        </h2>
        <ProductByCategory products={filteredProducts} />
      </div>
    );
  }

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,140,255,0.08),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto p-6">
        {/* Heading */}
        <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-12 drop-shadow-sm">
          {category ? `${category} Products` : "Explore Our Amazing Products"}
        </h2>

        {/* Product Grid using ProductCard */}
       {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
       ) : (
        <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-500">
            This category does not have products listed yet.
          </p>
        </div>
       )}

    {/* Modern Pagination */}
{totalPages > 1 && (
<div className="mt-14 flex justify-center items-center gap-2 flex-wrap">
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <button
      key={page}
      type="button"
      onClick={() => setCurrentPage(page)}
      className={`
        px-4 py-2 rounded-full font-semibold text-sm transition-all
        ${
          page === currentPage
            ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg scale-105"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
        }
      `}
    >
      {page}
    </button>
  ))}
</div>
)}


      </div>
    </div>
  );
}
