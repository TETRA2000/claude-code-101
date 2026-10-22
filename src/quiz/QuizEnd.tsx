import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { BrokenHeartIcon, StarIcon } from '../components/icons';
import type { DocEntry } from '../content/types';
import { DocsList } from '../screens/cards/DocsList';
import { useLang } from '../i18n/LangContext';
import { accuracy } from './session';
import type { Session } from './types';
import styles from './QuizEnd.module.css';

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

interface DoneProps {
  session: Session;
  docs?: readonly DocEntry[];
  onHome: () => void;
  onRetry: () => void;
}

export function QuizDone({ session, docs, onHome, onRetry }: DoneProps) {
  const { ui } = useLang();
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const perfect = session.firstTry === session.total;
  return (
    <div className={styles.screen}>
      <StarIcon />
      <div className={styles.titles}>
        <h1 ref={heading} tabIndex={-1} className={`${styles.title} ${styles.done}`}>
          {ui.doneTitle}
        </h1>
      </div>
      <ul className={styles.stats}>
        <li className={styles.stat}>+{ui.xp(session.xp)}</li>
        <li className={styles.stat}>{ui.accuracy(accuracy(session))}</li>
        <li className={`${styles.stat} ${styles.hearts}`}>{ui.heartsLeft(session.hearts)}</li>
      </ul>
      <p className={styles.sub}>{perfect ? ui.perfectRun : ui.retriedNote}</p>
      <DocsList docs={docs} />
      <div className={styles.actions}>
        <Button onClick={onHome}>{ui.continue}</Button>
        <Button variant="secondary" onClick={onRetry}>
          {ui.tryAgain}
        </Button>
      </div>
    </div>
  );
}

export function QuizOut({ onHome, onRetry }: { onHome: () => void; onRetry: () => void }) {
  const { ui } = useLang();
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <div className={styles.screen}>
      <BrokenHeartIcon />
      <div className={styles.titles}>
        <h1 ref={heading} tabIndex={-1} className={`${styles.title} ${styles.out}`}>
          {ui.outTitle}
        </h1>
        <p className={styles.sub}>{ui.outBody}</p>
      </div>
      <div className={styles.actions}>
        <Button onClick={onRetry}>{ui.tryAgain}</Button>
        <Button variant="secondary" onClick={onHome}>
          {ui.backToHome}
        </Button>
      </div>
    </div>
  );
}
