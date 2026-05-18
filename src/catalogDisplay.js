/** Display helpers for API catalog items (urlSlug vs internal slug). */

export function itemUrlSlug(item) {
  if (!item) return '';
  const slug = String(item.urlSlug || item.slug || '').trim();
  return slug;
}

export function itemInternalSlug(item) {
  return String(item?.slug || '').trim();
}

/** True when locale-specific shop URL differs from canonical slug. */
export function hasLocalizedUrlSlug(item) {
  const internal = itemInternalSlug(item);
  const url = itemUrlSlug(item);
  return Boolean(internal && url && url !== internal);
}

export function applyDocumentSeo({ title, description, locale }) {
  if (title) document.title = title;
  if (locale) document.documentElement.lang = locale;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc && description) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  if (metaDesc) {
    if (description) metaDesc.content = description;
    else metaDesc.remove();
  }
}

export function businessSeoFromProfile(business, businessName) {
  const title =
    business?.seoTitle?.trim() ||
    business?.name?.trim() ||
    businessName ||
    'Shop';
  const description =
    business?.seoDescription?.trim() ||
    business?.description?.trim() ||
    '';
  return { title, description };
}
