import "@/styles/globals.css";
import Head from "next/head";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { CartProvider } from "@/context/CartContext";

export default function App({ Component, pageProps }) {
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
        <div className="min-h-screen bg-[#f5f5f5] text-gray-900 flex flex-col">
          <Navbar />
          <main className="flex-grow pt-[118px] pb-16 md:pt-[76px] md:pb-0">
            <Component {...pageProps} />
          </main>
          <Footer />
          <MobileNavigation />
        </div>
      </CartProvider>
    </>
  );
}
