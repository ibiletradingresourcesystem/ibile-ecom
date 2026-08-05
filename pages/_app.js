import "@/styles/globals.css";
import Head from "next/head";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { CartProvider } from "@/context/CartContext";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>IbileMart Store</title>
        <meta
          name="description"
          content="Shop IbileMart Store for groceries, household essentials, personal care, beverages, and everyday deals."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>
            <div className="site-shell">
              <a className="skip-link" href="#main-content">Skip to content</a>
              <Navbar />
              <main id="main-content" className="site-main">
                <Component {...pageProps} />
              </main>
              <Footer />
              <MobileNavigation />
            </div>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </>
  );
}
