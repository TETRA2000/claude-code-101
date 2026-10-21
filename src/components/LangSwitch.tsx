import { useLang } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import styles from './LangSwitch.module.css';

/** Language names are shown in their own language, so they are not translated. */
const OPTIONS: { lang: Lang; label: string; htmlLang: Lang }[] = [
  { lang: 'en', label: 'English', htmlLang: 'en' },
  { lang: 'ja', label: '日本語', htmlLang: 'ja' },
];

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange(l: Lang): void }) {
  const { ui } = useLang();
  return (
    <div role="group" aria-label={ui.language} className={styles.group}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.htmlLang}
          aria-pressed={lang === o.lang}
          className={styles.option}
          onClick={() => onChange(o.lang)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
