export const CONDITION_BOX_LABELS: Record<string, { label: string; color: string; short: string }> = {
  mint: { label: 'Neuf sous blister', short: 'Neuf (cello)', color: 'emerald' },
  like_new: { label: 'Comme neuf', short: 'Comme neuf', color: 'teal' },
  good: { label: 'Bon état', short: 'Bon état', color: 'blue' },
  fair: { label: 'Boîte abîmée / usée', short: 'Usé', color: 'amber' },
};

export const CONDITION_COMPONENTS_LABELS: Record<string, string> = {
  mint: 'Neuf non dépunché',
  complete_like_new: 'Complet — Comme neuf',
  complete_good: 'Complet — Bon état',
  missing_parts: 'Incomplet (voir description)',
};

export const LANGUAGE_LABELS: Record<string, { label: string; flag: string }> = {
  VF: { label: 'Français (VF)', flag: '🇫🇷' },
  VO_EN: { label: 'Anglais (VO)', flag: '🇬🇧' },
  VO_DE: { label: 'Allemand', flag: '🇩🇪' },
  MULTILINGUAL: { label: 'Multilingue', flag: '🌍' },
  LANGUAGE_INDEPENDENT: { label: 'Sans texte', flag: '🎲' },
  OTHER: { label: 'Autre langue', flag: '🏳️' },
};

export const SHIPPING_METHODS_LABELS: Record<string, { label: string; icon: string }> = {
  hand_delivery: { label: 'Remise en main propre', icon: 'i-lucide-handshake' },
  mondial_relay: { label: 'Mondial Relay', icon: 'i-lucide-package' },
  shop2shop: { label: 'Chronopost Shop2Shop', icon: 'i-lucide-truck' },
  colissimo: { label: 'Colissimo', icon: 'i-lucide-mail' },
};

export const PAYMENT_METHODS_LABELS: Record<string, string> = {
  paypal: 'PayPal (entre proches)',
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces (main propre)',
  lydia: 'Sumeria / Lydia / Wero',
};

export const useMediaUrl = () => {
  const config = useRuntimeConfig();
  return (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${config.public.strapiUrl}${url}`;
  };
};
