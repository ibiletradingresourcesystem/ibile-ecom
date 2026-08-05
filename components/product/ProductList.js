import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import ProductByCategory from "./ProductByCategory";

export default function ProductList({
  groupByCategory = false,
  category = null,
  search = "",
  promotion = null,
  filter = null,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("featured");
  const productsPerPage = 12;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Unable to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch {
        setError("We could not load products right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, groupByCategory, promotion, filter]);

  const normalizeCategory = (value) => String(value || "").trim().toLowerCase();
  const categoryFilter = normalizeCategory(category);
  const searchFilter = String(search || "").trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    if (promotion && String(product.promotion || product.promotionId || "") !== promotion) return false;

    if (filter === "sale" && !product.onSale && !product.salePrice) return false;
    if (filter === "new") {
      const created = product.createdAt ? new Date(product.createdAt) : null;
      const daysOld = created ? (Date.now() - created.getTime()) / 86400000 : Infinity;
      if (daysOld > 30) return false;
    }

    const matchesCategory = !category || (() => {
        const productCategory = product.category;
        if (typeof productCategory === "object" && productCategory !== null) {
          return [productCategory._id, productCategory.name].some(
            (value) => normalizeCategory(value) === categoryFilter
          );
        }

        return normalizeCategory(productCategory) === categoryFilter;
      })();
    const searchableText = [product.name, product.description, typeof product.category === "string" ? product.category : product.category?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && (!searchFilter || searchableText.includes(searchFilter));
  });

  const sortedProducts = [...filteredProducts].sort((firstProduct, secondProduct) => {
    if (sortBy === "price-low") return Number(firstProduct.price || 0) - Number(secondProduct.price || 0);
    if (sortBy === "price-high") return Number(secondProduct.price || 0) - Number(firstProduct.price || 0);
    if (sortBy === "name") return String(firstProduct.name || "").localeCompare(String(secondProduct.name || ""));
    return 0;
  });

  if (loading) {
    return (
      <div className="catalog-products" aria-busy="true" aria-label="Loading products">
          <div className="market-product-grid">
            {Array.from({ length: 10 }, (_, index) => <div key={index} className="market-product-skeleton" />)}
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-empty">
        <h2 className="text-2xl font-bold text-gray-900">Products unavailable</h2>
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  // Grouped view
  if (groupByCategory) {
    return (
      <div className="catalog-products">
        <ProductByCategory products={filteredProducts} />
      </div>
    );
  }

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  return (
    <div className="catalog-products">
      {!groupByCategory && filteredProducts.length > 0 && (
        <div className="catalog-controls">
          <p aria-live="polite">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</p>
          <label>
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1); }}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
      )}
       {filteredProducts.length > 0 ? (
        <div className="market-product-grid">
          {currentProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
       ) : (
        <div className="market-empty">
          <h3 className="text-xl font-bold text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-500">
            This category does not have products listed yet.
          </p>
        </div>
       )}

{totalPages > 1 && (
  <div className="catalog-pagination">
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <button
      key={page}
      type="button"
      onClick={() => setCurrentPage(page)}
      className={page === currentPage ? "is-active" : ""}
    >
      {page}
    </button>
  ))}
</div>
)}
    </div>
  );
}
