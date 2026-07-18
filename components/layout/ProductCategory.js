// components/ProductCategory.js
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Baby,
  BoomBox,
  Croissant,
  Dog,
  Utensils,
  Cigarette,
  PencilRuler,
  Home,
  Wine,
  Heart,
  Wheat,
  Snowflake,
  Monitor,
  Coffee,
  ShoppingCart,
} from "lucide-react";

export default function ProductCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const categoryIcons = {
    Snacks: <Coffee className="w-5 h-5" />,
    "Baby Care": <Baby className="w-5 h-5" />,
    Cleaning: <BoomBox className="w-5 h-5" />,
    Bakery: <Croissant className="w-5 h-5" />,
    "Canine Care": <Dog className="w-5 h-5" />,
    Breakfast: <Utensils className="w-5 h-5" />,
    Smokes: <Cigarette className="w-5 h-5" />,
    Stationeries: <PencilRuler className="w-5 h-5" />,
    "Home & Kitchen": <Home className="w-5 h-5" />,
    "Wine & Beverages": <Wine className="w-5 h-5" />,
    "Personal Care": <Heart className="w-5 h-5" />,
    Pantry: <Wheat className="w-5 h-5" />,
    "Frozen Food": <Snowflake className="w-5 h-5" />,
    Electronics: <Monitor className="w-5 h-5" />,
    Default: <Box className="w-5 h-5" />,
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto py-10 px-6 bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Explore Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl border border-blue-100 bg-blue-50/70 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-10 px-6 bg-white">
      {/* Title + Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Explore Categories</h2>
      </div>

      {/* Top Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:flex sm:flex-row">
        {/* All Products */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 250 }}
        >
          <Link
            href="/products"
            className="block w-full sm:w-48 bg-gradient-to-br from-blue-600 to-blue-400 text-white rounded-2xl shadow-md px-4 py-5 hover:shadow-xl hover:from-blue-500 hover:to-blue-300 transition-all"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="text-sm font-semibold">All Products</h3>
              </div>
              <p className="text-xs text-white/90">
                Browse everything in one place
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Collapse / Expand */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 250 }}
          className="w-full sm:w-48 bg-gradient-to-br from-indigo-600 to-indigo-400 text-white rounded-2xl shadow-md px-4 py-5 hover:shadow-xl hover:from-indigo-500 hover:to-indigo-300 transition-all"
        >
          <div className="flex flex-col items-start gap-2">
            <div className="flex gap-1 items-center">
              <Box className="w-5 h-5" />
              <h3 className="text-sm font-semibold">
                {collapsed ? "Show" : "Hide"} Categories
              </h3>
            </div>
           <p className="text-xs text-white/90">
              {collapsed
                ? "Show all categories"
                : "Hide category list"}
            </p>
          </div>
          
        </motion.button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-image"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="col-span-full"
            >
              <div className="relative w-full h-60 sm:h-72 lg:h-80 overflow-hidden rounded-2xl border border-gray-200 shadow-lg shadow-blue-100/70">
                <p className="absolute top-6 left-6 z-10 max-w-[15rem] text-lg sm:max-w-sm sm:text-2xl lg:text-3xl font-bold text-gray-600 drop-shadow-lg">
                  Fresh Deals, Delivered Right to Your Door
                </p>

  {/* Background image */}
  <Image
    src="/images/bg.jpg"
    alt="Background"
    fill
    sizes="100vw"
    className="object-cover shadow-inner"
  />

  {/* Overlay image */}
  <Image
    src="/images/freeDelivery.png"
    alt="Free Delivery"
    width={320}
    height={320}
    className="absolute right-[-10px] top-1/2 h-40 w-auto -translate-y-1/2 sm:right-4 sm:h-56 lg:h-72"
  />

  {/* Optional overlay text */}
  <div className="absolute border border-gray-300 bg-white/85 py-2 px-3 rounded-md left-6 bottom-4 text-gray-600 font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-md">
    Free Delivery
  </div>
</div>

            </motion.div>
          ) : (
            categories.map((category) => {
              const icon =
                categoryIcons[category.name] || categoryIcons.Default;
              return (
                <motion.div
                  key={category._id}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 250 }}
                >
                  <Link
                    href={`/products?category=${encodeURIComponent(category.name)}`}
                    className="block h-full min-h-28 w-full bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 text-blue-700 rounded-2xl shadow-sm px-4 py-4 transition-all"
                  >
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">{icon}</span>
                        <h3 className="text-sm font-semibold">
                          {category.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {category.description || "No description"}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
