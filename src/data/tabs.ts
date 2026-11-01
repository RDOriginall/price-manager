export const TABS = [
  {
    id: 'products',
    label: 'محصولات',
    icon: 'M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5',
  },
  { id: 'form', label: 'افزودن', icon: 'M12 8v8m-4-4h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { id: 'sales', label: 'فروش', icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2' },
  { id: 'rates', label: 'نرخ ارز', icon: 'M7 7h13l-3-3m3 13H7l3 3M4 7h0m0 10h0' },
] as const;

export type TabId = (typeof TABS)[number]['id'];
