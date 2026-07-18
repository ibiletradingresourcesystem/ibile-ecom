// /pages/products/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProductView from "@/components/product/ProductView";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/webproducts/${id}`);
          if (res.ok) {
            const data = await res.json();
            setProduct(data);

            // ---- TRACK RECENTLY VIEWED ----
            try {
              const viewed = JSON.parse(localStorage.getItem("recentViews") || "[]");
              const updated = [data._id, ...viewed.filter((pid) => pid !== data._id)];
              localStorage.setItem("recentViews", JSON.stringify(updated.slice(0, 10)));

              const userId = localStorage.getItem("userId");
              if (userId) {
                fetch("/api/track", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId, productId: data._id }),
                });
              }
            } catch (err) {
              console.error("Tracking error:", err);
            }

          } else {
            console.error("Failed to fetch product");
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/50 md:p-8">
          <div className="h-80 animate-pulse rounded-2xl bg-blue-50" />
          <div className="space-y-4">
            <div className="h-8 w-32 animate-pulse rounded-full bg-blue-50" />
            <div className="h-10 w-3/4 animate-pulse rounded-full bg-blue-50" />
            <div className="h-24 animate-pulse rounded-2xl bg-blue-50" />
            <div className="h-10 w-40 animate-pulse rounded-full bg-blue-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <p className="mt-2 text-gray-500">
          The product may have been removed or is temporarily unavailable.
        </p>
      </div>
    );
  }

  return <ProductView product={product} />;
}
