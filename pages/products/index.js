import { useState } from "react";
import { useRouter } from "next/router";

import ProductList from "@/components/product/ProductList";

export default function ProductsPage() {
  const router = useRouter();
  const categoryFilter = router.query.category || null;
  const searchFilter = router.query.search || "";
  const [grouped, setGrouped] = useState(false);

  return (
    <div className="catalog-page">
      <div className="catalog-page__toolbar">
        <div>
          <p>Ibile Mart catalogue</p>
          <h1>{categoryFilter || (searchFilter ? `Results for “${searchFilter}”` : "All products")}</h1>
        </div>
        <button
          type="button"
          onClick={() => setGrouped(!grouped)}
          className="catalog-page__view-button"
        >
          {grouped ? "Show all" : "Group by category"}
        </button>
      </div>
      <ProductList groupByCategory={grouped} category={categoryFilter} search={searchFilter} />
    </div>
  );
}
