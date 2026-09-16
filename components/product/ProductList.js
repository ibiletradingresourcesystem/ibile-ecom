import { useMemo } from "react";

import ProductCard from "@/components/product/ProductCard";
import ProductByCategory from "./ProductByCategory";
import { useInfiniteScroll, useProductFeed } from "@/lib/useProducts";

const PAGE_SIZE = 24;

export default function ProductList({
  groupByCategory = false,
  category = null,
  search = "",
  sortBy = "featured",
  filter = null,
}) {
  // "new" is a sort/filter the API understands; anything else falls through to
  // the chosen sort order.
  const sort = filter === "new" ? "new" : sortBy;

  const { products, total, hasMore, loading, loadingMore, error, loadMore } = useProductFeed({
    limit: PAGE_SIZE,
    category: category || "",
    search: search || "",
    sort,
  });

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasMore && !loading && !groupByCategory,
  });

  const skeletons = useMemo(
    () => Array.from({ length: 10 }, (_, index) => <div key={index} className="market-product-skeleton" />),
    []
  );

  if (loading) {
    return (
      <div className="catalog-products" aria-busy="true" aria-label="Loading products">
        <div className="market-product-grid">{skeletons}</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="market-empty">
        <h2>Products unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (groupByCategory) {
    return (
      <div className="catalog-products">
        <ProductByCategory products={products} />
        {hasMore && (
          <div className="catalog-more">
            <button type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more products"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="catalog-products">
      {products.length > 0 ? (
        <>
          <div className="market-product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
            {loadingMore && skeletons.slice(0, 5)}
          </div>

          {/* Scrolling this into view loads the next page. */}
          <div ref={sentinelRef} className="catalog-sentinel" aria-hidden="true" />

          <p className="catalog-count" aria-live="polite">
            {hasMore
              ? `Showing ${products.length} of ${total}`
              : `All ${total} ${total === 1 ? "product" : "products"} shown`}
          </p>
        </>
      ) : (
        <div className="market-empty">
          <h3>No products found</h3>
          <p>
            {search
              ? `Nothing matched "${search}". Try a different spelling or a broader term.`
              : "This category does not have products listed yet."}
          </p>
        </div>
      )}
    </div>
  );
}
