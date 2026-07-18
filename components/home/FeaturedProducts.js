import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import SectionWrapper from "@/components/sections/SectionWrapper";
import CategoryList from "../categoryList/CategoryList";

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/webproducts");
        if (!res.ok) throw new Error("Unable to fetch products");
        const data = await res.json();

        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const randomProducts = shuffled.slice(0, 4);

        setFeatured(randomProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
   <>
    <SectionWrapper title="Featured Products">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-3xl border border-blue-100 bg-blue-50"
            />
          ))}
        </div>
      ) : featured.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product._id} product={product} badge="Featured" />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No products to display.
        </p>
      )}
    </SectionWrapper>
    <CategoryList />
   </>
  );
}