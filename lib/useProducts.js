import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared, deduplicated access to the catalogue endpoint.
 *
 * Several parts of a page ask for products at once (the home grid, suggestions,
 * a category strip). Without this they each issued their own request for the
 * same data on every mount and on every back-navigation. Responses are cached
 * per query and in-flight requests are shared, so the same page load hits the
 * network once per distinct query.
 */
const responseCache = new Map();
const inFlight = new Map();
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 60;

function buildQuery({ page = 1, limit = 24, category = "", search = "", sort = "featured" }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (sort && sort !== "featured") params.set("sort", sort);
  return params.toString();
}

export async function fetchProductPage(options = {}) {
  const query = buildQuery(options);
  const cached = responseCache.get(query);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (inFlight.has(query)) {
    return inFlight.get(query);
  }

  const request = fetch(`/api/products?${query}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("Unable to fetch products");
      const data = await res.json();

      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        responseCache.clear();
      }
      responseCache.set(query, { value: data, expiresAt: Date.now() + CACHE_TTL_MS });

      return data;
    })
    .finally(() => {
      inFlight.delete(query);
    });

  inFlight.set(query, request);
  return request;
}

export function clearProductCache() {
  responseCache.clear();
}

/**
 * Infinite-scroll catalogue state. `loadMore` is safe to call repeatedly — it
 * ignores calls while a page is already loading or the list is complete.
 */
export function useProductFeed({ limit = 24, category = "", search = "", sort = "featured" } = {}) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);

  // A new filter is a new list: reset and fetch page one.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 1;
    loadingRef.current = true;

    setLoading(true);
    setError("");
    setProducts([]);
    setHasMore(true);

    fetchProductPage({ page: 1, limit, category, search, sort })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError("We could not load products right now. Please try again shortly.");
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        loadingRef.current = false;
        setLoading(false);
      });
  }, [limit, category, search, sort]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;

    loadingRef.current = true;
    setLoadingMore(true);

    fetchProductPage({ page: nextPage, limit, category, search, sort })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;

        pageRef.current = nextPage;
        setProducts((current) => {
          // Guard against a product appearing twice if the catalogue shifted
          // between pages.
          const seen = new Set(current.map((product) => product._id));
          return [...current, ...(data.products || []).filter((product) => !seen.has(product._id))];
        });
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError("We could not load more products.");
        setHasMore(false);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        loadingRef.current = false;
        setLoadingMore(false);
      });
  }, [hasMore, limit, category, search, sort]);

  return { products, total, hasMore, loading, loadingMore, error, loadMore };
}

/**
 * Calls `onVisible` when the returned ref scrolls into view. Used as the
 * sentinel at the end of a product grid.
 */
export function useInfiniteScroll(onVisible, { enabled = true, rootMargin = "600px" } = {}) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onVisible);

  useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current?.();
        }
      },
      // Start fetching before the shopper reaches the bottom so the next rows
      // are usually already there.
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
