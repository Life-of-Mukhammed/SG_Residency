export const UZ_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  "Farg'ona viloyati",
  'Namangan viloyati',
  'Samarqand viloyati',
  'Buxoro viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Xorazm viloyati',
  "Qoraqalpog'iston Respublikasi",
] as const;

export type UzRegion = (typeof UZ_REGIONS)[number];
