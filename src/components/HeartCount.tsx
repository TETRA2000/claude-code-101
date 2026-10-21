import { HeartIcon } from './icons';
import styles from './HeartCount.module.css';

/** Heart icon + number. `label` is the localized screen-reader text (e.g. ui.heartsLeft(3)). */
export function HeartCount({ count, label }: { count: number; label?: string }) {
  return (
    <p className={styles.hearts}>
      <HeartIcon />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label ?? String(count)}</span>
    </p>
  );
}
