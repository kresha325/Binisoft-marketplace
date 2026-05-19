/** Per-business shop cart + checkout field toggles from admin Settings. */

const DEFAULT_CHECKOUT = {
  cartEnabled: true,
  customerName: true,
  deliveryAddress: false,
  orderNotes: true,
  phone: true,
};

const bySlug = new Map();

export function normalizeShopCheckout(raw) {
  const sc = raw?.shopCheckout && typeof raw.shopCheckout === 'object' ? raw.shopCheckout : raw || {};
  return {
    cartEnabled: sc.cartEnabled !== false,
    customerName: sc.customerName !== false,
    deliveryAddress: sc.deliveryAddress === true,
    orderNotes: sc.orderNotes !== false,
    phone: sc.phone !== false,
  };
}

export function registerShopCheckout(business) {
  const slug = business?.slug;
  if (!slug) return;
  bySlug.set(slug, normalizeShopCheckout(business));
}

export function getShopCheckout(slug) {
  if (slug && bySlug.has(slug)) return bySlug.get(slug);
  return { ...DEFAULT_CHECKOUT };
}

/** Merge rules when cart has lines from one or more stores. */
export function checkoutConfigForCart(cart, fallbackSlug = '') {
  const slugs = [...new Set(cart.map((i) => i.businessSlug || fallbackSlug).filter(Boolean))];
  if (!slugs.length) {
    return fallbackSlug ? getShopCheckout(fallbackSlug) : { ...DEFAULT_CHECKOUT };
  }
  const configs = slugs.map((s) => getShopCheckout(s));
  return {
    cartEnabled: configs.every((c) => c.cartEnabled),
    customerName: configs.some((c) => c.customerName),
    deliveryAddress: configs.some((c) => c.deliveryAddress),
    orderNotes: configs.some((c) => c.orderNotes),
    phone: configs.some((c) => c.phone),
  };
}

export function isCartEnabledForSlug(slug) {
  return getShopCheckout(slug).cartEnabled;
}
