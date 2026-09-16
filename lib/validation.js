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
 * Validates a phone number the store can actually call back on. Nigerian
 * numbers are accepted as 0XXXXXXXXXX, +234XXXXXXXXXX or 234XXXXXXXXXX;
 * other international numbers are accepted in +<country><number> form.
 */
export function isValidPhone(value) {
  if (!value || typeof value !== "string") return false;

  const digitsOnly = value.replace(/[\s()-]/g, "");
  if (!/^\+?[0-9]+$/.test(digitsOnly)) return false;

  if (/^0[7-9][01][0-9]{8}$/.test(digitsOnly)) return true;
  if (/^(\+?234)[7-9][01][0-9]{8}$/.test(digitsOnly)) return true;

  return /^\+[1-9][0-9]{7,14}$/.test(digitsOnly);
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
    const id = item?.productId || item?._id || item?.id;
    if (!isValidObjectId(id)) {
      return { valid: false, error: "Invalid product ID in cart" };
    }
    const qty = Number(item?.quantity);
    if (!Number.isFinite(qty) || qty < 1 || qty > 9999) {
      return { valid: false, error: "Invalid quantity in cart" };
    }
  }

  return { valid: true };
}

/**
 * Validates customer/shipping details for order creation.
 *
 * A delivery order needs somewhere to deliver to; a pickup order does not, so
 * the address requirement follows the chosen fulfilment method.
 */
export function validateCustomerDetails(details, { deliveryMethod = "delivery" } = {}) {
  if (!details || typeof details !== "object") {
    return { valid: false, error: "Customer details are required" };
  }

  const name = sanitizeString(details.name, 100);
  if (name.length < 2) {
    return { valid: false, error: "Please enter the full name for this order" };
  }

  const phone = sanitizeString(details.phone, 20);
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }

  if (!isValidPhone(phone)) {
    return { valid: false, error: "Enter a valid phone number, e.g. 08012345678" };
  }

  if (details.email) {
    const email = sanitizeString(details.email, 100);
    if (!isValidEmail(email)) {
      return { valid: false, error: "Invalid email format" };
    }
  }

  if (deliveryMethod === "delivery") {
    const address = sanitizeString(details.address, 300);
    if (address.length < 8) {
      return { valid: false, error: "Enter a delivery address our rider can find" };
    }

    if (!sanitizeString(details.city, 80)) {
      return { valid: false, error: "City or town is required for delivery" };
    }
  }

  return { valid: true };
}
