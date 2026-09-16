/**
 * Local record of orders placed from this browser.
 *
 * A guest has no account, so the signed access token returned when the order is
 * created is the only way back into their confirmation page. It is kept here so
 * "your orders" still works without forcing anyone to register.
 */
const STORAGE_KEY = "guestOrders";
const MAX_STORED_ORDERS = 20;

function readAll() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.id && entry?.token) : [];
  } catch {
    return [];
  }
}

export function getStoredOrders() {
  return readAll();
}

export function rememberOrder({ id, token, orderNumber, total, createdAt }) {
  if (typeof window === "undefined" || !id || !token) return;

  const next = [
    { id, token, orderNumber: orderNumber || "", total: Number(total || 0), createdAt: createdAt || new Date().toISOString() },
    ...readAll().filter((entry) => entry.id !== id),
  ].slice(0, MAX_STORED_ORDERS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the confirmation page still works from the URL.
  }
}

export function getStoredOrderToken(orderId) {
  return readAll().find((entry) => entry.id === orderId)?.token || "";
}
