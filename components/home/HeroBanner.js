import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const { store } = useStore();
  const storePhone = store?.storePhone || "";

  useEffect(() => {
    async function fetchHeroes() {
      try {
        const res = await fetch("/api/heroes");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setSlides(data.slides?.length ? data.slides : []);
      } catch {
        setSlides([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHeroes();
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [slides.length, goNext]);

  if (loading) {
    return <section className="hero-banner hero-banner--loading"><div className="hero-banner__inner" /></section>;
  }

  if (slides.length === 0) return null;

  const slide = slides[current] || slides[0];
  const hasBg = Boolean(slide.bgImage);
  const hasImage = Boolean(slide.image);
  const isCampaign = slide.bannerType === "promotion" || slide.bannerType === "campaign";

  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      {hasBg && (
        <Image
          src={slide.bgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-banner__bg"
        />
      )}
      <div className={`hero-banner__inner ${hasBg ? "has-bg" : ""}`}>
        <div className="hero-banner__content">
          {isCampaign && (
            <span className="hero-banner__tag">
              {slide.bannerType === "promotion" ? "Promotion" : "Campaign"}
            </span>
          )}
          <h1 id="hero-title">{slide.title}</h1>
          {slide.subtitle && <p>{slide.subtitle}</p>}
          <div className="hero-banner__actions">
            {slide.ctaLink && (
              <Link href={slide.ctaLink} className="hero-banner__cta hero-banner__cta--primary">
                {slide.ctaText || "Shop now"} <ArrowRight />
              </Link>
            )}
          </div>
        </div>
        {(hasImage || !hasBg) && (
          <div className="hero-banner__visual" aria-hidden="true">
            <Image
              src={hasImage ? slide.image : "/images/Logo.png"}
              alt=""
              width={400}
              height={400}
              priority
              className={!hasImage ? "hero-banner__brand-mark" : ""}
            />
          </div>
        )}
      </div>

      {storePhone && (
        <a href={`tel:${storePhone}`} className="hero-banner__call-fixed">
          Call to order
        </a>
      )}

      {slides.length > 1 && (
        <div className="hero-banner__nav">
          <button type="button" onClick={goPrev} aria-label="Previous slide"><ChevronLeft /></button>
          <div className="hero-banner__dots">
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setCurrent(i)}
                className={i === current ? "is-active" : ""}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button type="button" onClick={goNext} aria-label="Next slide"><ChevronRight /></button>
        </div>
      )}
    </section>
  );
}
