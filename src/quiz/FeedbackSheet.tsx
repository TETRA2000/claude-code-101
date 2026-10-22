import { useEffect, useRef } from 'react';
import { DocLink } from '../components/DocLink';
import { CheckCircleIcon, XCircleIcon } from '../components/icons';
import { RichText } from '../components/RichText';
import type { Item } from '../content/types';
import { useLang } from '../i18n/LangContext';
import { feedbackFor } from './feedback';
import type { AnswerState } from './types';
import { useArmed } from './useArmed';
import styles from './FeedbackSheet.module.css';

interface Props {
  item: Item;
  answer: AnswerState;
  /** Queue position, for rotating praise. */
  index: number;
  /** Continue ignores activation this long after appearing (double-tap guard). */
  guardMs: number;
  onContinue: () => void;
}

/** Slides up after Check. Must be rendered inside an always-present aria-live region. */
export function FeedbackSheet({ item, answer, index, guardMs, onContinue }: Props) {
  const { lang, ui } = useLang();
  const { title, headline, body, explain, more, checks } = feedbackFor(item, answer, index, lang);
  const continueRef = useRef<HTMLButtonElement>(null);
  const armed = useArmed('sheet', guardMs);

  // Check just disappeared; keep keyboard focus in the flow.
  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <section className={`${styles.sheet} ${answer.ok ? styles.ok : styles.bad}`} aria-label={ui.feedback}>
      {headline && <span className={styles.badge}>{title}</span>}
      <div className={styles.head}>
        {answer.ok ? <CheckCircleIcon size={28} /> : <XCircleIcon size={28} />}
        <h2 className={styles.title}>{headline ?? title}</h2>
      </div>
      {body && (
        <p className={styles.detail}>
          <RichText text={body} />
        </p>
      )}
      <p className={styles.explain}>
        <RichText text={explain} />
      </p>
      {checks && (
        <div className={styles.checks}>
          <h3 className={styles.checksTitle}>{ui.ruleTestsTitle}</h3>
          <ul className={styles.checkList}>
            {checks.map((c, i) => (
              <li key={i} className={`${styles.check} ${c.ok ? styles.checkOk : styles.checkMiss}`} data-testid="check">
                {c.ok ? <CheckCircleIcon size={18} /> : <XCircleIcon size={18} />}
                <code className={styles.checkLabel}>{c.label}</code>
                <span className={styles.checkText}>{c.ok ? ui.ruleTestOk : ui.ruleTestMiss}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {more && <DocLink docRef={more} />}
      <button
        ref={continueRef}
        type="button"
        className={styles.continue}
        aria-disabled={armed ? undefined : true}
        onClick={() => armed && onContinue()}
      >
        {ui.continue}
      </button>
    </section>
  );
}
