import { useState } from "react";
import { useRouter } from "next/router";

import ProductList from "@/components/product/ProductList";

export default function ProductsPage() {
  const router = useRouter();
  const categoryFilter = router.query.category || null;
  const [grouped, setGrouped] = useState(false);

  return (
    <div>
      <div className="text-right px-6 pt-4">
        <button
          onClick={() => setGrouped(!grouped)}
          className="text-sm text-white rounded-2xl py-2 px-3 bg-blue-400  hover:text-blue-800 transition"
        >
          {grouped ? "Switch to Paginated View" : "Group by Category"}
        </button>
      </div>
      <ProductList groupByCategory={grouped} category={categoryFilter} />
    </div>
  );
}
