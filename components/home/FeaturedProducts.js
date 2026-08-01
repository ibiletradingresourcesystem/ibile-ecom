import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Headphones, PackageCheck, Truck } from "lucide-react";

import ProductCard from "@/components/product/ProductCard";
import ProductCategory from "@/components/layout/ProductCategory";
import HeroBanner from "@/components/home/HeroBanner";
import { useStore } from "@/context/StoreContext";

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const { store } = useStore();
  const storePhone = store?.storePhone || "";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Unable to fetch products");
        const data = await res.json();
        setFeatured(data.slice(0, 10));
      } catch {
        setFeatured([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="market-home">
      <HeroBanner />

      <section className="market-benefits" aria-label="Shopping benefits">
        <div><Truck /><span><strong>Flexible delivery</strong><small>Confirmed when we call</small></span></div>
        <div><PackageCheck /><span><strong>Stock</strong><small>Inventory-backed availability</small></span></div>
        <div><Headphones /><span><strong>Human support</strong><small>{storePhone ? `Call ${storePhone}` : "Contact us"}</small></span></div>
      </section>

      <ProductCategory />

      <section className="market-section">
        <div className="market-section__heading">
          <div>
            <p>Available now</p>
            <h2>Popular products</h2>
          </div>
          <Link href="/products">See all <ArrowRight /></Link>
        </div>

        {loading ? (
          <div className="market-product-grid">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="market-product-skeleton" />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="market-product-grid">
            {featured.map((product, index) => (
              <ProductCard key={product._id} product={product} badge={index < 2 ? "Top pick" : null} />
            ))}
          </div>
        ) : (
          <div className="market-empty">Products will appear here when inventory is available.</div>
        )}
      </section>

      {storePhone && (
        <section className="market-callout">
          <div>
            <p>Prefer to speak with someone?</p>
            <h2>Place your order by phone.</h2>
            <span>Our team will confirm availability, payment and delivery details directly.</span>
          </div>
          <a href={`tel:${storePhone}`}><Headphones /> {storePhone}</a>
        </section>
      )}
    </div>
  );
}