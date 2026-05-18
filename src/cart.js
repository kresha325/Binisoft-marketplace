import { getBusinessSlug } from './slug.js';

const CART_KEY = 'jon_sport_cart_v2';

function lineKey(item) {
  return `${item.businessSlug || ''}:${item.variantId ? `${item.productId}:${item.variantId}` : item.productId}`;
}

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    const slug = getBusinessSlug();
    return items.map((i) => ({
      ...i,
      businessSlug: i.businessSlug || slug || '',
    }));
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

/** Group cart lines by business slug for split checkout. */
export function groupCartByBusiness(cart) {
  const map = new Map();
  for (const item of cart) {
    const slug = item.businessSlug || getBusinessSlug() || 'unknown';
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug).push(item);
  }
  return map;
}

export function cartBusinessSlugs(cart) {
  return [...new Set(cart.map((i) => i.businessSlug || getBusinessSlug()).filter(Boolean))];
}

/**
 * @param {object} product - catalog product
 * @param {number} [qty]
 * @param {object|null} [variant]
 * @param {string} [businessSlug] - store slug for multi-business cart
 */
export function addToCart(product, qty = 1, variant = null, businessSlug = null) {
  const cart = loadCart();
  const slug = businessSlug || getBusinessSlug() || '';
  const variantId = variant?.id || null;
  const key = lineKey({ productId: product.id, variantId, businessSlug: slug });
  const existing = cart.find((i) => lineKey(i) === key);
  const price =
    variant != null ? Number(variant.price ?? 0) : Number(product.price ?? 0);
  const name =
    variant != null ? formatVariantName(product.name, variant) : product.name;

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      productId: product.id,
      variantId,
      businessSlug: slug,
      name,
      price,
      quantity: qty,
    });
  }
  saveCart(cart);
  return cart;
}

export function formatVariantName(productName, variant) {
  const attrs = variant.attributes || {};
  const parts = Object.values(attrs).filter(Boolean);
  const label = parts.join(' / ') || variant.sku || '';
  return label ? `${productName} (${label})` : productName;
}

export function updateQty(productId, quantity, variantId = null, businessSlug = null) {
  let cart = loadCart();
  const slug = businessSlug || getBusinessSlug() || '';
  const key = lineKey({ productId, variantId, businessSlug: slug });
  if (quantity <= 0) {
    cart = cart.filter((i) => lineKey(i) !== key);
  } else {
    cart = cart.map((i) => (lineKey(i) === key ? { ...i, quantity } : i));
  }
  saveCart(cart);
  return cart;
}

export function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(cart) {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}
