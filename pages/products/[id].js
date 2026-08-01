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
          const res = await fetch(`/api/products/${id}`);
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
      <div className="product-detail product-detail--loading">
        <div /><div />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="market-empty product-detail__not-found">
        <h1>Product not found</h1>
        <p>
          The product may have been removed or is temporarily unavailable.
        </p>
      </div>
    );
  }

  return <ProductView product={product} />;
}
