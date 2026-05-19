const GENERIC_ORDER_LABELS = new Set([
  'porosit tani',
  'shiko produktet',
  'porosit online',
  'order now',
  'view products',
]);

const FOOD_ORDER = new Set(['restaurant', 'cafe', 'fastFood']);
const RETAIL_ORDER = new Set([
  'retail',
  'fashion',
  'electronics',
  'grocery',
  'bakery',
  'wholesale',
  'pharmacy',
  'agriculture',
  'petShop',
]);
const APPOINTMENT = new Set([
  'services',
  'salon',
  'spa',
  'clinic',
  'fitness',
  'education',
  'automotive',
]);

function category(type) {
  if (!type) return 'contactLead';
  if (FOOD_ORDER.has(type)) return 'foodOrder';
  if (RETAIL_ORDER.has(type)) return 'retailOrder';
  if (APPOINTMENT.has(type)) return 'appointment';
  return 'contactLead';
}

export function heroPreset(type) {
  const cat = category(type);
  if (cat === 'foodOrder') {
    return {
      primaryLabel: 'Porosit tani',
      primaryTarget: 'products',
      secondaryLabel: 'Shërbimet',
      secondaryTarget: 'services',
      trustBullets: ['Porosi online', 'Menu & oferta', 'Kontakt i shpejtë'],
    };
  }
  if (cat === 'retailOrder') {
    return {
      primaryLabel: 'Shiko produktet',
      primaryTarget: 'products',
      secondaryLabel: 'Ofertat',
      secondaryTarget: 'offers',
      trustBullets: ['Produkte të zgjedhura', 'Porosi online', 'Çmime transparente'],
    };
  }
  if (cat === 'appointment') {
    return {
      primaryLabel: 'Rezervo termin',
      primaryTarget: 'whatsapp',
      secondaryLabel: 'Shërbimet',
      secondaryTarget: 'services',
      trustBullets:
        type === 'clinic'
          ? ['Termine & konsultime', 'Na kontaktoni', 'Lokacion i qartë']
          : ['Rezervim i lehtë', 'Na kontaktoni', 'Orar i përshtatshëm'],
    };
  }
  return {
    primaryLabel: type === 'hotel' ? 'Rezervo qëndrimin' : 'Na kontaktoni',
    primaryTarget: 'contact',
    secondaryLabel: 'Shërbimet',
    secondaryTarget: 'services',
    trustBullets: ['Përgjigje e shpejtë', 'Eksperiencë profesionale', 'Na vizitoni'],
  };
}

export function contactLabelFor(type) {
  const cat = category(type);
  if (cat === 'appointment' || cat === 'contactLead') return 'Na kontaktoni';
  if (cat === 'foodOrder') return 'Porosit në WhatsApp';
  return 'Na shkruani në WhatsApp';
}

function isGenericOrderLabel(label) {
  const n = String(label || '')
    .trim()
    .toLowerCase();
  return n && GENERIC_ORDER_LABELS.has(n);
}

function allowsOrderCopy(type) {
  const cat = category(type);
  return cat === 'foodOrder' || cat === 'retailOrder';
}

/** Effective hero CTA copy + targets (saved config + business type). */
export function resolveHeroCta(heroCfg, business) {
  const type = business?.businessType || '';
  const preset = heroPreset(type);
  const allowOrder = allowsOrderCopy(type);

  let primaryLabel = heroCfg?.ctaLabel || preset.primaryLabel;
  if (heroCfg?.ctaLabel && !allowOrder && isGenericOrderLabel(heroCfg.ctaLabel)) {
    primaryLabel = preset.primaryLabel;
  }

  return {
    primaryLabel,
    primaryTarget: heroCfg?.ctaTarget || preset.primaryTarget,
    secondaryLabel: heroCfg?.secondaryCtaLabel || preset.secondaryLabel,
    secondaryTarget: heroCfg?.secondaryCtaTarget || preset.secondaryTarget,
    trustBullets:
      heroCfg?.trustBullets?.length > 0 ? heroCfg.trustBullets : preset.trustBullets,
  };
}

export function resolveContactCtaLabel(contactCfg, business) {
  const type = business?.businessType || '';
  if (contactCfg?.ctaLabel) return contactCfg.ctaLabel;
  return contactLabelFor(type);
}

export function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function openWhatsApp(business) {
  const digits = phoneDigits(business?.orderPhone);
  if (!digits) {
    return false;
  }
  window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
  return true;
}
