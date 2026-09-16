import { useEffect, useState } from "react";

import ProductCard from "@/components/product/ProductCard";

/**
 * "You may also like" strip. Built from what this browser has recently viewed,
 * so it needs no account and no extra catalogue download.
 */
export default function ProductSuggestions({ excludeId = "", title = "You may also like" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      try {
        const params = new URLSearchParams();

        try {
          const recentViews = JSON.parse(localStorage.getItem("recentViews") || "[]");
          if (Array.isArray(recentViews) && recentViews.length > 0) {
            params.set("recentIds", recentViews.slice(0, 10).join(","));
          }
        } catch {
          // No usable history in this browser; fall back to the default list.
        }

        const res = await fetch(`/api/suggestions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch suggestions");

        const data = await res.json();
        if (cancelled) return;

        setProducts(
          (Array.isArray(data) ? data : [])
            .filter((product) => String(product._id) !== String(excludeId))
            .slice(0, 5)
        );
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [excludeId]);

  if (loading) {
    return (
      <section className="market-section" aria-busy="true">
        <div className="market-section__heading">
          <div><h2>{title}</h2></div>
        </div>
        <div className="market-product-grid">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="market-product-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="market-section">
      <div className="market-section__heading">
        <div><h2>{title}</h2></div>
      </div>
      <div className="market-product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
