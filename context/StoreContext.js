import { createContext, useContext, useState, useEffect } from "react";

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStore() {
      try {
        const res = await fetch("/api/store");
        if (!res.ok) throw new Error("Failed to fetch store info");
        const data = await res.json();
        if (!cancelled) {
          setStore(data.store || null);
        }
      } catch (err) {
        console.error("Unable to load store info:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStore();
    return () => { cancelled = true; };
  }, []);

  return (
    <StoreContext.Provider value={{ store, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
