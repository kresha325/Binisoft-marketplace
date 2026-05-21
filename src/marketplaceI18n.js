import { getShopLocale } from './locale.js';

const STRINGS = {
  sq: {
    brandName: 'Marketplace',
    heroEyebrow: 'Binisoft Marketplace',
    heroTitle: 'Zbulo dyqanet & blerje online',
    heroSub:
      'Të gjitha bizneset nga platforma — profilet krijohen nga admin dashboard dhe sinkronizohen automatikisht.',
    searchLabel: 'Kërko',
    searchPlaceholder: 'Kërko dyqan, produkt, kategori…',
    statStores: 'Dyqane',
    statProducts: 'Produkte',
    statCategories: 'Kategori',
    statOffers: 'Oferta',
    tabStores: 'Dyqane',
    tabProducts: 'Produkte',
    tabCategories: 'Kategori',
    tabOffers: 'Oferta',
    emptyStores: 'Nuk u gjet asnjë dyqan.',
    emptyProducts: 'Nuk u gjet asnjë produkt.',
    emptyCategories: 'Nuk u gjet asnjë kategori.',
    emptyOffers: 'Nuk ka oferta aktive.',
    categoryNotFound: 'Kategoria nuk u gjet.',
    categoryHint: 'Zgjidhni një kategori për të parë produktet nga të gjitha dyqanet.',
    categoryBack: '← Kategoritë',
    productsCount: '{n} produkte',
    storesCount: '{n} dyqane',
    storeCountOne: '1 dyqan',
    enterStore: 'Hyr në dyqan →',
    storeProducts: '{n} produkte',
    storeCategories: '{n} kategori',
    storeOffers: '{n} oferta',
    offerProducts: '{n} produkte',
    categoryViewSub: '{n} produkte nga {stores}',
    loading: 'Duke ngarkuar marketplace…',
    pageTitle: 'Binisoft Marketplace — Dyqane & produkte',
    pageDescription:
      'Zbulo të gjitha dyqanet, produktet, kategoritë dhe ofertat në platformë.',
    langModalTitle: 'Gjuha',
  },
  en: {
    brandName: 'Marketplace',
    heroEyebrow: 'Binisoft Marketplace',
    heroTitle: 'Discover shops & shop online',
    heroSub:
      'All businesses on the platform — profiles are created in the admin dashboard and sync automatically.',
    searchLabel: 'Search',
    searchPlaceholder: 'Search shop, product, category…',
    statStores: 'Shops',
    statProducts: 'Products',
    statCategories: 'Categories',
    statOffers: 'Offers',
    tabStores: 'Shops',
    tabProducts: 'Products',
    tabCategories: 'Categories',
    tabOffers: 'Offers',
    emptyStores: 'No shops found.',
    emptyProducts: 'No products found.',
    emptyCategories: 'No categories found.',
    emptyOffers: 'No active offers.',
    categoryNotFound: 'Category not found.',
    categoryHint: 'Pick a category to see products from all shops.',
    categoryBack: '← Categories',
    productsCount: '{n} products',
    storesCount: '{n} shops',
    storeCountOne: '1 shop',
    enterStore: 'Enter shop →',
    storeProducts: '{n} products',
    storeCategories: '{n} categories',
    storeOffers: '{n} offers',
    offerProducts: '{n} products',
    categoryViewSub: '{n} products from {stores}',
    loading: 'Loading marketplace…',
    pageTitle: 'Binisoft Marketplace — Shops & products',
    pageDescription: 'Discover all shops, products, categories and offers on the platform.',
    langModalTitle: 'Language',
  },
  de: {
    brandName: 'Marketplace',
    heroEyebrow: 'Binisoft Marketplace',
    heroTitle: 'Shops entdecken & online einkaufen',
    heroSub:
      'Alle Unternehmen der Plattform — Profile werden im Admin-Dashboard erstellt und automatisch synchronisiert.',
    searchLabel: 'Suchen',
    searchPlaceholder: 'Shop, Produkt, Kategorie suchen…',
    statStores: 'Shops',
    statProducts: 'Produkte',
    statCategories: 'Kategorien',
    statOffers: 'Angebote',
    tabStores: 'Shops',
    tabProducts: 'Produkte',
    tabCategories: 'Kategorien',
    tabOffers: 'Angebote',
    emptyStores: 'Keine Shops gefunden.',
    emptyProducts: 'Keine Produkte gefunden.',
    emptyCategories: 'Keine Kategorien gefunden.',
    emptyOffers: 'Keine aktiven Angebote.',
    categoryNotFound: 'Kategorie nicht gefunden.',
    categoryHint: 'Wählen Sie eine Kategorie, um Produkte aus allen Shops zu sehen.',
    categoryBack: '← Kategorien',
    productsCount: '{n} Produkte',
    storesCount: '{n} Shops',
    storeCountOne: '1 Shop',
    enterStore: 'Zum Shop →',
    storeProducts: '{n} Produkte',
    storeCategories: '{n} Kategorien',
    storeOffers: '{n} Angebote',
    offerProducts: '{n} Produkte',
    categoryViewSub: '{n} Produkte aus {stores}',
    loading: 'Marketplace wird geladen…',
    pageTitle: 'Binisoft Marketplace — Shops & Produkte',
    pageDescription:
      'Entdecken Sie alle Shops, Produkte, Kategorien und Angebote auf der Plattform.',
    langModalTitle: 'Sprache',
  },
};

/** @param {keyof typeof STRINGS['sq']} key */
export function mt(key, vars = {}) {
  const loc = getShopLocale();
  const table = STRINGS[loc] || STRINGS.sq;
  let text = table[key] ?? STRINGS.sq[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

export function marketplaceLangModalTitle() {
  return mt('langModalTitle');
}
