import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Headphones, PackageCheck, PhoneCall, Truck } from "lucide-react";

import ProductCard from "@/components/product/ProductCard";
import ProductCategory from "@/components/layout/ProductCategory";

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <section className="market-hero" aria-labelledby="market-hero-title">
        <Image src="/images/bg2.jpg" alt="" fill priority sizes="100vw" className="market-hero__background" />
        <div className="market-hero__content">
          <p className="market-hero__eyebrow">Stocked for everyday living</p>
          <h1 id="market-hero-title">Everything you need, ready when you need it.</h1>
          <p>Shop groceries, home essentials, personal care and more from Ibile Mart&apos;s live inventory.</p>
          <div className="market-hero__actions">
            <Link href="/products" className="market-button market-button--dark">
              Shop all products <ArrowRight />
            </Link>
            <a href="tel:02018883300" className="market-button market-button--light">
              <PhoneCall /> Call to order
            </a>
          </div>
        </div>
        <div className="market-hero__visual" aria-hidden="true">
          <Image src="/images/freeDelivery.png" alt="" width={420} height={420} priority />
        </div>
      </section>

      <section className="market-benefits" aria-label="Shopping benefits">
        <div><Truck /><span><strong>Flexible delivery</strong><small>Confirmed when we call</small></span></div>
        <div><PackageCheck /><span><strong>Stock</strong><small>Inventory-backed availability</small></span></div>
        <div><Headphones /><span><strong>Human support</strong><small>Call 0201 888 3300</small></span></div>
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

      <section className="market-callout">
        <div>
          <p>Prefer to speak with someone?</p>
          <h2>Place your order by phone.</h2>
          <span>Our team will confirm availability, payment and delivery details directly.</span>
        </div>
        <a href="tel:02018883300"><PhoneCall /> 0201 888 3300</a>
      </section>
    </div>
  );
}