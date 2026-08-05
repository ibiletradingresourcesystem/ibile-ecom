import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const { store } = useStore();
  const storePhone = store?.storePhone || "";

  useEffect(() => {
    fetch("/api/heros")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setSlides(Array.isArray(data.slides) ? data.slides : []))
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [slides.length, goNext]);

  if (loading) {
    return <div className="hero-shell hero-shell--loading" />;
  }

  if (!slides.length) return null;

  const slide = slides[current] || slides[0];
  const hasBg = Boolean(slide.bgImage);
  const hasImg = Boolean(slide.image);

  return (
    <div className="hero-shell">
      {/* Background image layer */}
      {hasBg && (
        <Image
          src={slide.bgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", zIndex: 0 }}
        />
      )}

      {/* Dark overlay for bg images */}
      {hasBg && <div className="hero-shell__overlay" />}

      {/* Content */}
      <div className="hero-shell__grid">
        <div className="hero-shell__text">
          {slide.bannerType !== "standard" && (
            <span className="hero-shell__badge">
              {slide.bannerType === "campaign" ? "Campaign" : "Promotion"}
            </span>
          )}
          <h1 className="hero-shell__title">{slide.title}</h1>
          {slide.subtitle && <p className="hero-shell__subtitle">{slide.subtitle}</p>}
          <div className="hero-shell__buttons">
            {slide.ctaLink && (
              <Link href={slide.ctaLink} className="hero-shell__btn hero-shell__btn--primary">
                {slide.ctaText || "Shop now"} <ArrowRight size={16} />
              </Link>
            )}
            {storePhone && (
              <a href={`tel:${storePhone}`} className="hero-shell__btn hero-shell__btn--secondary">
                <Phone size={14} /> Call to order
              </a>
            )}
          </div>
        </div>

        {hasImg && (
          <div className="hero-shell__image">
            <Image src={slide.image} alt="" width={380} height={380} priority style={{ objectFit: "contain" }} />
          </div>
        )}
      </div>

      {/* Slide navigation */}
      {slides.length > 1 && (
        <div className="hero-shell__nav">
          <button type="button" onClick={goPrev} aria-label="Previous"><ChevronLeft size={16} /></button>
          {slides.map((s, i) => (
            <button
              key={s._id || i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`hero-shell__dot ${i === current ? "active" : ""}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <button type="button" onClick={goNext} aria-label="Next"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
