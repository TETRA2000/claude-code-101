import { docHref } from '../content/docs';
import type { DocRef } from '../content/types';
import { useLang } from '../i18n/LangContext';
import { ExternalIcon } from './icons';
import styles from './DocLink.module.css';

interface Props {
  docRef: DocRef;
  /** Visible text; defaults to "Learn more". */
  label?: string;
}

/** A plain link to the official docs. Opens in a new tab; says so for screen readers; nothing is fetched. */
export function DocLink({ docRef, label }: Props) {
  const { lang, ui } = useLang();
  const { href, lang: pageLang } = docHref(docRef, lang);
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer" hrefLang={pageLang}>
      <span className={styles.text}>{label ?? ui.learnMore}</span>
      {pageLang !== lang && <span className={styles.lang}>{ui.englishPage}</span>}
      <ExternalIcon />
      <span className="sr-only"> {ui.opensNewTab}</span>
    </a>
  );
}
