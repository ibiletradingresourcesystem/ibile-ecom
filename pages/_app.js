import { useEffect, useState } from "react";
import "@/styles/globals.css";
import Head from "next/head";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCategory from "@/components/layout/ProductCategory";
import ProductSuggestions from "@/components/customer/ProductSuggestions";
import { CartProvider } from "@/context/CartContext";



export default function App({ Component, pageProps }) {
  const [userId, setUserId] = useState(undefined);

  useEffect(() => {
    const loadUserId = async () => {
      setUserId(localStorage.getItem("userId") || null);
    };

    loadUserId();
  }, []);

  return (
    <>
      <Head>
        <title>Ibile Mart Store</title>
        <meta
          name="description"
          content="Shop Ibile Mart Store for groceries, household essentials, personal care, beverages, and everyday deals."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CartProvider>
        <div className="bg-background text-gray-900 dark:text-white min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow mt-16">
            <ProductCategory />
            <Component {...pageProps} />
            {userId !== undefined && <ProductSuggestions userId={userId} />}
          </main>
          <Footer />
        </div>
      </CartProvider>
    </>
  );
}
