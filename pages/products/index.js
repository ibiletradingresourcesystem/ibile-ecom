import { useState } from "react";
import { useRouter } from "next/router";

import ProductList from "@/components/product/ProductList";

const FILTER_LABELS = {
  featured: "Featured Products",
  new: "New Arrivals",
  sale: "On Sale",
};

export default function ProductsPage() {
  const router = useRouter();
  const categoryFilter = router.query.category || null;
  const searchFilter = router.query.search || "";
  const promotionFilter = router.query.promotion || null;
  const filterType = router.query.filter || null;
  const [grouped, setGrouped] = useState(false);

  const heading = promotionFilter
    ? "Promotion Products"
    : filterType
      ? FILTER_LABELS[filterType] || "All products"
      : categoryFilter || (searchFilter ? `Results for "${searchFilter}"` : "All products");

  return (
    <div className="catalog-page">
      <div className="catalog-page__toolbar">
        <div>
          <p>IbileMart Store catalogue</p>
          <h1>{heading}</h1>
        </div>
        <button
          type="button"
          onClick={() => setGrouped(!grouped)}
          className="catalog-page__view-button"
        >
          {grouped ? "Show all" : "Group by category"}
        </button>
      </div>
      <ProductList
        groupByCategory={grouped}
        category={categoryFilter}
        search={searchFilter}
        promotion={promotionFilter}
        filter={filterType}
      />
    </div>
  );
}
