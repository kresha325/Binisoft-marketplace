/** Albanian labels for businessType from Firestore (matches admin app). */
const LABELS_SQ = {
  retail: 'Shitje me pakicë',
  fashion: 'Modë & veshje',
  electronics: 'Elektronikë',
  it: 'IT & softuer',
  digitalAgency: 'Agjenci digjitale',
  construction: 'Ndërtim',
  realEstate: 'Patundshmëri',
  photography: 'Fotografi',
  events: 'Evente',
  logistics: 'Logjistikë',
  agriculture: 'Bujqësi',
  grocery: 'Market',
  bakery: 'Furrë',
  wholesale: 'Shitje me shumicë',
  restaurant: 'Restorant',
  pizzeria: 'Piceri',
  cafe: 'Kafene',
  fastFood: 'Fast food',
  bar: 'Bar & lounge',
  catering: 'Catering & banak',
  butcher: 'Qendër mishi',
  iceCream: 'Akullore',
  flowerShop: 'Floristeri',
  jewelry: 'Argjendari',
  bookstore: 'Librari',
  pharmacy: 'Farmaci',
  petShop: 'Dyqan kafshësh',
  services: 'Shërbime',
  salon: 'Sallon bukurie',
  spa: 'Spa & wellness',
  clinic: 'Klinikë',
  automotive: 'Auto & pjesë',
  fitness: 'Fitnes',
  education: 'Edukim',
  professional: 'Profesionist',
  homeServices: 'Shërbime shtëpie',
  hotel: 'Hotel & akomodim',
  other: 'Biznes',
};

export function businessTypeLabel(raw) {
  const key = String(raw || '').trim();
  if (!key) return '';
  return LABELS_SQ[key] || '';
}
