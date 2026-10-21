import type { ReactNode } from 'react';
import styles from './TerminalFrame.module.css';

/** Dark terminal panel with three dots and a mono title. Purely decorative chrome. */
export function TerminalFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
