import mongoose from "mongoose";

/**
 * Sanitizes and trims a string value, enforcing a max length.
 */
export function sanitizeString(value, maxLength = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/**
 * Validates that a value is a valid MongoDB ObjectId string.
 */
export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

/**
 * Validates an email address format (basic check).
 */
export function isValidEmail(value) {
  if (!value || typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Validates a phone number (allows digits, spaces, +, -, parens).
 */
export function isValidPhone(value) {
  if (!value || typeof value !== "string") return true; // optional
  return /^[0-9+\-() ]{7,20}$/.test(value.trim());
}

/**
 * Validates and sanitizes cart items from the client.
 */
export function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "Cart items are required" };
  }

  if (items.length > 100) {
    return { valid: false, error: "Too many items in cart" };
  }

  for (const item of items) {
    const id = item.productId || item._id || item.id;
    if (!isValidObjectId(id)) {
      return { valid: false, error: "Invalid product ID in cart" };
    }
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty < 1 || qty > 9999) {
      return { valid: false, error: "Invalid quantity in cart" };
    }
  }

  return { valid: true };
}

/**
 * Validates customer/shipping details for order creation.
 */
export function validateCustomerDetails(details) {
  if (!details || typeof details !== "object") {
    return { valid: false, error: "Customer details are required" };
  }

  const name = sanitizeString(details.name, 100);
  if (!name) {
    return { valid: false, error: "Customer name is required" };
  }

  const phone = sanitizeString(details.phone, 20);
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }

  if (!isValidPhone(phone)) {
    return { valid: false, error: "Invalid phone number format" };
  }

  if (details.email) {
    const email = sanitizeString(details.email, 100);
    if (!isValidEmail(email)) {
      return { valid: false, error: "Invalid email format" };
    }
  }

  return { valid: true };
}
