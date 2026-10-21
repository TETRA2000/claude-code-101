import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { t as pick, type Lang, type Localized } from './lang';
import { UI, type UiStrings } from './ui';

interface LangValue {
  lang: Lang;
  ui: UiStrings;
  t: (l: Localized) => string;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<LangValue>(
    () => ({ lang, ui: UI[lang], t: (l: Localized) => pick(l, lang) }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const v = useContext(LangContext);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}
