import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import SectionWrapper from "@/components/sections/SectionWrapper";

export default function ProductSuggestions({ userId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        let url = "/api/suggestions";

        if (userId) {
          // Logged-in user
          url += `?userId=${userId}`;
        } else {
          // Guest: Use recent views from localStorage
          const recentViews = JSON.parse(localStorage.getItem("recentViews") || "[]");
          if (recentViews.length > 0) {
            url += `?recentIds=${recentViews.join(",")}`;
          }
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch suggestions");

        const data = await res.json();
        setProducts(data.slice(0, 4));
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userId]);

  if (loading) {
    return (
      <SectionWrapper title="Products You May Like">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-3xl border border-blue-100 bg-blue-50"
            />
          ))}
        </div>
      </SectionWrapper>
    );
  }

  if (!products.length) return null;

   return (
    <SectionWrapper title="Products You May Like">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} badge="You May Like" />
        ))}
      </div>
    </SectionWrapper>
  );
}
