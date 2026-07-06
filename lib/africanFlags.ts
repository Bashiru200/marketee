/**
 * lib/africanCountries.ts
 * Centralised map of all 54 African country names → flag emoji.
 * Import anywhere: import { AFRICAN_FLAGS } from '@/lib/africanCountries'
 */

export const AFRICAN_FLAGS: Record<string, string> = {
  // North Africa
  Algeria:              '🇩🇿',
  Egypt:                '🇪🇬',
  Libya:                '🇱🇾',
  Morocco:              '🇲🇦',
  Sudan:                '🇸🇩',
  Tunisia:              '🇹🇳',

  // West Africa
  Benin:                '🇧🇯',
  'Burkina Faso':       '🇧🇫',
  'Cape Verde':         '🇨🇻',
  Gambia:               '🇬🇲',
  Ghana:                '🇬🇭',
  Guinea:               '🇬🇳',
  'Guinea-Bissau':      '🇬🇼',
  "Côte d'Ivoire":      '🇨🇮',
  'Ivory Coast':        '🇨🇮',
  Liberia:              '🇱🇷',
  Mali:                 '🇲🇱',
  Mauritania:           '🇲🇷',
  Niger:                '🇳🇪',
  Nigeria:              '🇳🇬',
  Senegal:              '🇸🇳',
  'Sierra Leone':       '🇸🇱',
  Togo:                 '🇹🇬',

  // Central Africa
  Angola:               '🇦🇴',
  Cameroon:             '🇨🇲',
  'Central African Republic': '🇨🇫',
  Chad:                 '🇹🇩',
  Congo:                '🇨🇬',
  'DR Congo':           '🇨🇩',
  'Democratic Republic of the Congo': '🇨🇩',
  DRC:                  '🇨🇩',
  'Equatorial Guinea':  '🇬🇶',
  Gabon:                '🇬🇦',
  'São Tomé and Príncipe': '🇸🇹',

  // East Africa
  Burundi:              '🇧🇮',
  Comoros:              '🇰🇲',
  Djibouti:             '🇩🇯',
  Eritrea:              '🇪🇷',
  Ethiopia:             '🇪🇹',
  Kenya:                '🇰🇪',
  Madagascar:           '🇲🇬',
  Malawi:               '🇲🇼',
  Mauritius:            '🇲🇺',
  Mozambique:           '🇲🇿',
  Rwanda:               '🇷🇼',
  Seychelles:           '🇸🇨',
  Somalia:              '🇸🇴',
  'South Sudan':        '🇸🇸',
  Tanzania:             '🇹🇿',
  Uganda:               '🇺🇬',
  Zambia:               '🇿🇲',
  Zimbabwe:             '🇿🇼',

  // Southern Africa
  Botswana:             '🇧🇼',
  Eswatini:             '🇸🇿',
  Swaziland:            '🇸🇿',
  Lesotho:              '🇱🇸',
  Namibia:              '🇳🇦',
  'South Africa':       '🇿🇦',
}

// Helper — returns the flag or a fallback globe emoji
export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return '🌍'
  return AFRICAN_FLAGS[country] ?? '🌍'
}