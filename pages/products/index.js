import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";

import ProductList from "@/components/product/ProductList";

const FILTER_LABELS = {
  featured: "Featured Products",
  new: "New Arrivals",
  sale: "On Sale",
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

export default function ProductsPage() {
  const router = useRouter();
  const categoryFilter = router.query.category || null;
  const searchFilter = router.query.search || "";
  const filterType = router.query.filter || null;

  const [grouped, setGrouped] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const heading = filterType
    ? FILTER_LABELS[filterType] || "All products"
    : categoryFilter || (searchFilter ? `Results for "${searchFilter}"` : "All products");

  return (
    <>
      <Head>
        <title>{`${heading} | IbileMart Store`}</title>
      </Head>
      <div className="catalog-page">
        <div className="catalog-page__toolbar">
          <div>
            <p>IbileMart Store catalogue</p>
            <h1>{heading}</h1>
          </div>

          <div className="catalog-page__controls">
            <label className="catalog-sort">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setGrouped(!grouped)}
              className="catalog-page__view-button"
              aria-pressed={grouped}
            >
              {grouped ? <LayoutGrid size={16} /> : <Rows3 size={16} />}
              {grouped ? "Show all" : "By category"}
            </button>
          </div>
        </div>

        <ProductList
          groupByCategory={grouped}
          category={categoryFilter}
          search={searchFilter}
          sortBy={sortBy}
          filter={filterType}
        />
      </div>
    </>
  );
}
