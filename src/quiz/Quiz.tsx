import { useEffect, useReducer, useRef, type Dispatch } from 'react';
import { Button } from '../components/Button';
import { HeartCount } from '../components/HeartCount';
import { CloseIcon } from '../components/icons';
import { LangSwitch } from '../components/LangSwitch';
import { ProgressBar } from '../components/ProgressBar';
import { RichText } from '../components/RichText';
import { content as defaultContent, type Content } from '../content';
import type { Item } from '../content/types';
import { useLang } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import { ACTIVATION_GUARD_MS } from '../state/rules';
import { FeedbackSheet } from './FeedbackSheet';
import { QuizDone, QuizOut } from './QuizEnd';
import { ItemBody } from './renderers/ItemBody';
import { canCheck, currentItem, isAutoGraded, sessionReducer, startSession, type SessionAction } from './session';
import type { Session } from './types';
import { useArmed } from './useArmed';
import styles from './Quiz.module.css';

export interface QuizResult {
  unitKey: string;
  xp: number;
}

interface Props {
  unitKey: string;
  items: readonly Item[];
  onExit: () => void;
  /** Called once per finished run (queue exhausted), never for an out-of-hearts run. */
  onComplete: (result: QuizResult) => void;
  onLang: (l: Lang) => void;
  /** How long Check/Continue ignore activation after appearing (double-tap guard). */
  guardMs?: number;
  /** Source of practice-type names; defaults to the real course content. */
  content?: Content;
}

export function Quiz({ unitKey, items, onExit, onComplete, onLang, guardMs = ACTIVATION_GUARD_MS, content = defaultContent }: Props) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession(unitKey, items));
  const restart = () => dispatch({ type: 'start' });

  // A finished session never changes again (the reducer ignores everything but
  // 'start'), so remembering which one we reported makes this exactly-once.
  const reported = useRef<Session | null>(null);
  useEffect(() => {
    if (session.phase === 'done' && reported.current !== session) {
      reported.current = session;
      onComplete({ unitKey: session.unitKey, xp: session.xp });
    }
  }, [session, onComplete]);

  if (session.phase === 'done') return <QuizDone session={session} onHome={onExit} onRetry={restart} />;
  if (session.phase === 'out') return <QuizOut onHome={onExit} onRetry={restart} />;
  return <QuizQuestion session={session} dispatch={dispatch} onExit={onExit} onLang={onLang} guardMs={guardMs} content={content} />;
}

interface QuestionProps {
  session: Session;
  dispatch: Dispatch<SessionAction>;
  onExit: () => void;
  onLang: (l: Lang) => void;
  guardMs: number;
  content: Content;
}

function QuizQuestion({ session, dispatch, onExit, onLang, guardMs, content }: QuestionProps) {
  const { lang, ui, t } = useLang();
  const item = currentItem(session)!; // phase 'question' guarantees a current item
  const a = session.answer;
  const promptRef = useRef<HTMLHeadingElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const checkArmed = useArmed(session.idx, guardMs);

  // New item: start at the top and announce its prompt.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    promptRef.current?.focus({ preventScroll: true });
  }, [session.idx]);

  const pct = session.total ? Math.round((session.solved / session.total) * 100) : 0;
  const typeInfo = content.practiceType(item.type);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.close} aria-label={ui.quit} onClick={onExit}>
          <CloseIcon />
        </button>
        <ProgressBar label={ui.practice} value={pct} />
        <HeartCount count={session.hearts} label={ui.heartsLeft(session.hearts)} />
        <LangSwitch lang={lang} onChange={onLang} />
      </header>

      <div className={styles.titleBlock}>
        {typeInfo && <span className={styles.typeChip}>{t(typeInfo.name)}</span>}
        <h1 ref={promptRef} tabIndex={-1} className={styles.prompt}>
          <RichText text={t(item.prompt)} />
        </h1>
      </div>

      <main ref={mainRef} className={styles.main}>
        <ItemBody key={session.idx} item={item} answer={a} act={dispatch} />
      </main>

      <div className={styles.footer}>
        {!a.checked && !isAutoGraded(item) && (
          <div className={styles.bar}>
            <Button
              className={styles.check}
              disabled={!canCheck(item, a)}
              aria-disabled={checkArmed ? undefined : true}
              onClick={() => checkArmed && dispatch({ type: 'check' })}
            >
              {ui.check}
            </Button>
          </div>
        )}
        <div aria-live="polite">
          {a.checked && (
            <FeedbackSheet
              key={session.idx}
              item={item}
              answer={a}
              index={session.idx}
              guardMs={guardMs}
              onContinue={() => dispatch({ type: 'next' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
