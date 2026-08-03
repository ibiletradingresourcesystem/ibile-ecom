import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // Load session on mount
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlist(saved);
    } catch { setWishlist([]); }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        localStorage.removeItem("customerToken");
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("customerToken", data.token);
    setCustomer(data.customer);
    return data;
  };

  const register = async (payload) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    localStorage.setItem("customerToken", data.token);
    setCustomer(data.customer);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("customerToken");
    setCustomer(null);
  };

  const updateProfile = async (updates) => {
    const token = localStorage.getItem("customerToken");
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    setCustomer(data.customer);
    return data;
  };

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === product._id);
      const next = exists ? prev.filter((p) => p._id !== product._id) : [...prev, product];
      localStorage.setItem("wishlist", JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some((p) => p._id === productId);
  }, [wishlist]);

  return (
    <AuthContext.Provider value={{
      customer,
      loading,
      login,
      register,
      logout,
      updateProfile,
      wishlist,
      toggleWishlist,
      isInWishlist,
      isAuthenticated: !!customer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
