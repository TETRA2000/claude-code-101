export type Lang = 'en' | 'ja';
export interface Localized {
  en: string;
  ja: string;
}

export const t = (l: Localized, lang: Lang): string => l[lang];

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'ja';
}

/** Stored choice, else `ja` if the browser's first language starts with `ja`, else `en`. */
export function detectLang(stored: unknown, browserLanguages: readonly string[]): Lang {
  if (isLang(stored)) return stored;
  const first = browserLanguages[0];
  if (typeof first === 'string' && first.toLowerCase().startsWith('ja')) return 'ja';
  return 'en';
}
