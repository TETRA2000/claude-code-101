import { RichText } from '../../components/RichText';
import type { Card } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './Deep.module.css';

/** "Under the hood": optional detail, collapsed until the learner opens it. */
export function Deep({ deep }: { deep: NonNullable<Card['deep']> }) {
  const { ui, t } = useLang();
  return (
    <details className={styles.deep}>
      <summary className={styles.summary}>{ui.underTheHood}</summary>
      <div className={styles.body}>
        <h2 className={styles.title}>{t(deep.title)}</h2>
        {deep.body.map((p, i) => (
          <p key={i} className={styles.para}>
            <RichText text={t(p)} />
          </p>
        ))}
      </div>
    </details>
  );
}
