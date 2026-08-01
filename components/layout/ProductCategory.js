import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryIcon } from "@/lib/categoryIcons";

export default function ProductCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCategories(data);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="market-section">
        <div className="market-section__heading"><div><p>Browse faster</p><h2>Shop by category</h2></div></div>
        <div className="market-category-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="market-category-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="market-section">
      <div className="market-section__heading">
        <div><p>Browse faster</p><h2>Shop by category</h2></div>
        <Link href="/products">All categories</Link>
      </div>
      <div className="market-category-grid">
        {categories.slice(0, 10).map((category) => {
          const Icon = getCategoryIcon(category.icon, category.name);
          return (
            <Link key={category._id} href={`/products?category=${encodeURIComponent(category.name)}`} className="market-category">
              <span><Icon /></span>
              <strong>{category.name}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
