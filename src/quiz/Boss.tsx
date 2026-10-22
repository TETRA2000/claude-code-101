import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch } from 'react';
import { Button } from '../components/Button';
import { DocLink } from '../components/DocLink';
import { CheckCircleIcon, CloseIcon, XCircleIcon } from '../components/icons';
import { LangSwitch } from '../components/LangSwitch';
import { ProgressBar } from '../components/ProgressBar';
import { RichText } from '../components/RichText';
import { choicesOf } from '../content/approve';
import type { ApproveItem, Item } from '../content/types';
import { useLang } from '../i18n/LangContext';
import type { Lang, Localized } from '../i18n/lang';
import { ACTIVATION_GUARD_MS } from '../state/rules';
import { bossCurrent, bossReducer, bossRight, bossXp, BOSS_SECONDS, isAllowed, startBoss, type BossAction, type BossState } from './boss';
import { freshAnswer } from './grade';
import type { QuizResult } from './Quiz';
import { Approve } from './renderers/Approve';
import { useArmed } from './useArmed';
import styles from './Boss.module.css';

interface Props {
  unitKey: string;
  title: Localized;
  /** The unit's items; only approve prompts take part (the validator allows nothing else in a boss unit). */
  items: readonly Item[];
  /** Length of a run; tests and the dev-only `?bossSeconds=` param shorten it. */
  seconds?: number;
  onExit: () => void;
  /** Called once per finished run (time out or every prompt answered). */
  onComplete: (result: QuizResult) => void;
  onLang: (l: Lang) => void;
  /** How long a new prompt ignores taps after appearing (double-tap guard). */
  guardMs?: number;
  /** The title of the unit a picked prompt comes from (`fromUnit`), for the recap. */
  unitTitle?: (key: string) => Localized | undefined;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** The live-region text: silent except at 30, 10 and 0 seconds (and only for marks inside the run). */
function announcement(s: BossState, say: (n: number) => string): string {
  if (s.phase === 'intro') return '';
  if (s.left <= 0) return say(0);
  if (s.left <= 10 && s.seconds > 10) return say(10);
  if (s.left <= 30 && s.seconds > 30) return say(30);
  return '';
}

export function Boss({ unitKey, title, items, seconds = BOSS_SECONDS, onExit, onComplete, onLang, guardMs = ACTIVATION_GUARD_MS, unitTitle }: Props) {
  const { ui } = useLang();
  const prompts = useMemo(() => items.filter((it): it is ApproveItem => it.type === 'approve'), [items]);
  const [s, dispatch] = useReducer(bossReducer, undefined, () => startBoss(prompts, seconds));
  const [paused, setPaused] = useState(false);

  // One tick a second while running. Pausing clears the interval, so no tick is lost or doubled.
  useEffect(() => {
    if (s.phase !== 'run' || paused) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [s.phase, paused]);

  // A recap state never changes again (the reducer ignores everything but 'start'), so this reports once per run.
  const reported = useRef<BossState | null>(null);
  useEffect(() => {
    if (s.phase === 'recap' && reported.current !== s) {
      reported.current = s;
      onComplete({ unitKey, xp: bossXp(s) });
    }
  }, [s, unitKey, onComplete]);

  const start = () => {
    setPaused(false);
    dispatch({ type: 'start' });
  };

  return (
    <div className={styles.root}>
      <div className="sr-only" aria-live="polite" data-testid="boss-announce">
        {announcement(s, ui.bossSecondsLeft)}
      </div>
      {s.phase === 'intro' && <Intro title={title} state={s} onStart={start} onExit={onExit} onLang={onLang} />}
      {s.phase === 'run' && (
        <Run state={s} dispatch={dispatch} paused={paused} onPause={() => setPaused((p) => !p)} onExit={onExit} onLang={onLang} guardMs={guardMs} />
      )}
      {s.phase === 'recap' && <Recap state={s} onHome={onExit} onRetry={start} unitTitle={unitTitle} />}
    </div>
  );
}

function useFocusOn<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [key]);
  return ref;
}

function Header({ onExit, onLang, children }: { onExit: () => void; onLang: (l: Lang) => void; children?: React.ReactNode }) {
  const { lang, ui } = useLang();
  return (
    <header className={styles.header}>
      <button type="button" className={styles.close} aria-label={ui.quit} onClick={onExit}>
        <CloseIcon />
      </button>
      <div className={styles.headerMid}>{children}</div>
      <LangSwitch lang={lang} onChange={onLang} />
    </header>
  );
}

function Intro({ title, state, onStart, onExit, onLang }: { title: Localized; state: BossState; onStart: () => void; onExit: () => void; onLang: (l: Lang) => void }) {
  const { ui, t } = useLang();
  const heading = useFocusOn<HTMLHeadingElement>('intro');
  return (
    <div className={styles.screen}>
      <Header onExit={onExit} onLang={onLang} />
      <main className={styles.intro}>
        <h1 ref={heading} tabIndex={-1} className={styles.bigTitle}>
          {t(title)}
        </h1>
        <p className={styles.lead}>{ui.bossIntro(state.seconds, state.queue.length)}</p>
        <ul className={styles.rules}>
          {ui.bossIntroRules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <Button className={styles.wide} onClick={onStart}>
          {ui.bossStart}
        </Button>
      </main>
    </div>
  );
}

interface RunProps {
  state: BossState;
  dispatch: Dispatch<BossAction>;
  paused: boolean;
  onPause: () => void;
  onExit: () => void;
  onLang: (l: Lang) => void;
  guardMs: number;
}

function Run({ state, dispatch, paused, onPause, onExit, onLang, guardMs }: RunProps) {
  const { ui, t } = useLang();
  const item = bossCurrent(state)!; // phase 'run' guarantees a current prompt
  const answer = useMemo(() => freshAnswer(item), [item]);
  const armed = useArmed(state.idx, guardMs);
  const heading = useFocusOn<HTMLHeadingElement>(state.idx);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [state.idx]);

  const pct = state.queue.length ? (state.answers.length / state.queue.length) * 100 : 0;
  const share = state.seconds ? (state.left / state.seconds) * 100 : 0;
  const choices = choicesOf(item);

  return (
    <div className={styles.screen}>
      <Header onExit={onExit} onLang={onLang}>
        <ProgressBar label={ui.bossProgress} value={pct} />
      </Header>
      <div className={styles.clockRow}>
        <div role="timer" aria-label={ui.bossTimeLabel} className={`${styles.clock} ${state.left <= 10 ? styles.low : ''}`}>
          {clock(state.left)}
        </div>
        <div className={styles.countdown} aria-hidden="true">
          <div className={`${styles.countdownFill} ${state.left <= 10 ? styles.low : ''}`} style={{ width: `${share}%` }} />
        </div>
        <button type="button" className={styles.pause} onClick={onPause}>
          {paused ? ui.bossResume : ui.bossPause}
        </button>
      </div>
      {paused && (
        <p className={styles.pausedNote} role="status">
          {ui.bossPausedNote}
        </p>
      )}
      <div className={styles.titleBlock}>
        <h1 ref={heading} tabIndex={-1} className={styles.prompt}>
          <RichText text={t(item.prompt)} />
        </h1>
      </div>
      <main ref={mainRef} className={styles.main}>
        <Approve
          key={state.idx}
          item={item}
          answer={answer}
          act={(a) => {
            if (a.type !== 'select' || !armed) return;
            const choice = choices[a.sel];
            if (choice) dispatch({ type: 'answer', choice });
          }}
        />
      </main>
    </div>
  );
}

function Recap({
  state,
  onHome,
  onRetry,
  unitTitle,
}: {
  state: BossState;
  onHome: () => void;
  onRetry: () => void;
  unitTitle?: (key: string) => Localized | undefined;
}) {
  const { ui, t } = useLang();
  const heading = useFocusOn<HTMLHeadingElement>('recap');
  const answered = state.answers.length;
  return (
    <main className={styles.recap}>
      <h1 ref={heading} tabIndex={-1} className={styles.bigTitle}>
        {state.left <= 0 ? ui.bossTimeUp : ui.bossRecapTitle}
      </h1>
      <p className={styles.lead}>{ui.bossScore(bossRight(state), answered, state.queue.length)}</p>
      <p className={styles.xp}>+{ui.xp(bossXp(state))}</p>
      {answered === 0 && <p className={styles.lead}>{ui.bossNoAnswers}</p>}
      {answered > 0 && (
        <ol className={styles.list}>
          {state.answers.map((a, i) => {
            const item = state.byId[a.id]!;
            const outcome = item.outcomes[a.choice];
            const from = item.fromUnit ? unitTitle?.(item.fromUnit) : undefined;
            return (
              <li key={i} className={`${styles.row} ${a.ok ? styles.ok : styles.bad}`}>
                <div className={styles.rowHead}>
                  {a.ok ? <CheckCircleIcon size={22} /> : <XCircleIcon size={22} />}
                  <strong className={styles.verdict}>{a.ok ? ui.bossRight : ui.bossWrong}</strong>
                  <span className={styles.choice}>{isAllowed(a.choice) ? ui.bossAllowed : ui.bossDenied}</span>
                  <span className={styles.where}>{item.surface === 'terminal' ? ui.inTerminal : ui.inDesktop}</span>
                </div>
                <code className={styles.target}>{item.target}</code>
                {outcome?.headline && (
                  <p className={styles.headline}>
                    <span className={styles.badge}>{ui.breaking}</span>
                    <span className={styles.headlineText}>{t(outcome.headline)}</span>
                  </p>
                )}
                {outcome && (
                  <p className={styles.lesson}>
                    <RichText text={t(outcome.feedback)} />
                  </p>
                )}
                {from && <p className={styles.from}>{ui.bossFrom(t(from))}</p>}
                {item.more && <DocLink docRef={item.more} />}
              </li>
            );
          })}
        </ol>
      )}
      <div className={styles.actions}>
        <Button onClick={onHome}>{ui.continue}</Button>
        <Button variant="secondary" onClick={onRetry}>
          {ui.tryAgain}
        </Button>
      </div>
    </main>
  );
}
