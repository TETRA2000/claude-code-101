import { useState } from 'react';
import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './demos.module.css';

type Props = { demo: Extract<Demo, { kind: 'context' }> };
type Who = Props['demo']['chunks'][number]['who'];
const WHOS: Who[] = ['setup', 'you', 'claude', 'outside'];

export function ContextDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const [colored, setColored] = useState(false);
  const names: Record<Who, string> = { setup: ui.whoSetup, you: ui.whoYou, claude: ui.whoClaude, outside: ui.whoOutside };
  const present = WHOS.filter((w) => demo.chunks.some((c) => c.who === w));
  return (
    <div className={styles.demo}>
      <button type="button" aria-pressed={colored} className={styles.toggle} onClick={() => setColored(!colored)}>
        {ui.colorByAuthor}
      </button>
      <div className={styles.stack}>
        {demo.chunks.map((c, i) => (
          <div key={i} className={`${styles.chunk} ${colored ? styles[`who_${c.who}`] : ''}`} data-who={colored ? c.who : undefined}>
            <div className={styles.chunkHead}>
              <span>{t(c.label)}</span>
              {colored && <span className={styles.author}>{t(c.author)}</span>}
            </div>
            <div className={styles.chunkText}>{t(c.text)}</div>
          </div>
        ))}
      </div>
      {colored && (
        <div className={styles.legend}>
          <span className={styles.legendTitle}>{ui.legendTitle}</span>
          <ul className={styles.legendList}>
            {present.map((w) => (
              <li key={w} className={styles.legendItem}>
                <span className={`${styles.swatch} ${styles[`who_${w}`]}`} aria-hidden="true" />
                {names[w]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
