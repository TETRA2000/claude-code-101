import { Button } from '../components/Button';
import { useLang } from '../i18n/LangContext';
import styles from './Loading.module.css';

interface Props {
  failed: boolean;
  onRetry(): void;
  onHome(): void;
}

/** Shown while a unit's body loads, or when loading it failed. */
export function Loading({ failed, onRetry, onHome }: Props) {
  const { ui } = useLang();
  return (
    <main className={styles.screen}>
      <p className={styles.message} role={failed ? 'alert' : 'status'} aria-live="polite">
        {failed ? ui.loadFailed : ui.loadingUnit}
      </p>
      {!failed && <span className={styles.spinner} aria-hidden="true" />}
      {failed && (
        <div className={styles.actions}>
          <Button onClick={onRetry}>{ui.tryAgain}</Button>
          <Button variant="secondary" onClick={onHome}>
            {ui.backToHome}
          </Button>
        </div>
      )}
    </main>
  );
}
