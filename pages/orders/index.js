import Head from "next/head";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import OrderHistory from "@/components/orders/OrderHistory";

export default function OrdersPage() {
  return (
    <>
      <Head><title>My Orders | IbileMart Store</title></Head>
      <div className="order-page">
        <div className="order-page__inner">
          <Link href="/products" className="checkout-page__back">
            <ChevronLeft className="h-4 w-4" /> Continue shopping
          </Link>

          <div className="checkout-panel-heading">
            <div>
              <p>Order tracking</p>
              <h1>My orders</h1>
            </div>
          </div>

          <OrderHistory />
        </div>
      </div>
    </>
  );
}
