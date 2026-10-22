import { DocLink } from '../../components/DocLink';
import { docHref } from '../../content/docs';
import type { DocEntry } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './DocsList.module.css';

/** The unit's "Official docs" list: each link shown by its address, with a "read this if…" note. */
export function DocsList({ docs }: { docs: readonly DocEntry[] | undefined }) {
  const { lang, ui, t } = useLang();
  if (!docs || docs.length === 0) return null;
  return (
    <section className={styles.docs}>
      <h2 className={styles.heading}>{ui.officialDocs}</h2>
      <ul className={styles.list}>
        {docs.map((d, i) => (
          <li key={i} className={styles.item}>
            <DocLink docRef={d.ref} label={docHref(d.ref, lang).href.replace(/^https:\/\//, '')} />
            <span className={styles.note}>{t(d.note)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
