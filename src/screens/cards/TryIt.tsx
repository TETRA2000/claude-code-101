import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { TryIt as TryItData, TryStep } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import { RichText } from '../../components/RichText';
import styles from './TryIt.module.css';

type Tab = 'terminal' | 'desktop';
const TABS: readonly Tab[] = ['terminal', 'desktop'];
type CopyState = 'copied' | 'failed';

/** Copies text; never throws. Resolves false when the clipboard is missing, blocked or insecure. */
async function copyText(text: string): Promise<boolean> {
  try {
    const clip = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    if (!clip || typeof clip.writeText !== 'function') return false;
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Steps({ steps }: { steps: TryStep[] }) {
  const { ui, t } = useLang();
  const [state, setState] = useState<Record<number, CopyState>>({});
  const copy = async (i: number, code: string) => {
    const ok = await copyText(code);
    setState((s) => ({ ...s, [i]: ok ? 'copied' : 'failed' }));
  };
  return (
    <ol className={styles.steps}>
      {steps.map((st, i) => (
        <li key={i} className={styles.step}>
          <p className={styles.text}>
            <RichText text={t(st.text)} />
          </p>
          {st.code && (
            <div className={styles.codeRow}>
              <code className={styles.code}>{st.code}</code>
              {st.copy && (
                <button
                  type="button"
                  className={styles.copy}
                  aria-label={`${ui.copy}: ${st.code}`}
                  onClick={() => void copy(i, st.code!)}
                >
                  {ui.copy}
                </button>
              )}
            </div>
          )}
          {st.copy && (
            <span className={styles.status} role="status" aria-live="polite">
              {state[i] === 'copied' && <span className={styles.ok}><span aria-hidden="true">{'\u2713 '}</span><span>{ui.copied}</span></span>}
              {state[i] === 'failed' && <span className={styles.bad}><span aria-hidden="true">{'! '}</span><span>{ui.copyFailed}</span></span>}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** "Try it": numbered steps for the Terminal and the Desktop app. Copy buttons only on `copy` steps. */
export function TryIt({ data }: { data: TryItData }) {
  const { ui, t } = useLang();
  const [tab, setTab] = useState<Tab>('terminal');
  const base = useId();
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ terminal: null, desktop: null });
  const label = (k: Tab) => (k === 'terminal' ? ui.tabTerminal : ui.tabDesktop);
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    let next: Tab | undefined;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    else if (e.key === 'ArrowLeft') next = TABS[(i + TABS.length - 1) % TABS.length];
    else if (e.key === 'Home') next = TABS[0];
    else if (e.key === 'End') next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    setTab(next);
    refs.current[next]?.focus();
  };
  return (
    <section className={styles.try} data-try>
      <h2 className={styles.heading}>{ui.tryIt}</h2>
      <div className={styles.tabs} role="tablist" onKeyDown={onKey}>
        {TABS.map((k) => (
          <button
            key={k}
            ref={(el) => {
              refs.current[k] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`${base}-panel-${k}`}
            tabIndex={tab === k ? 0 : -1}
            className={styles.tab}
            onClick={() => setTab(k)}
          >
            {label(k)}
          </button>
        ))}
      </div>
      <div role="tabpanel" tabIndex={0} id={`${base}-panel-${tab}`} aria-labelledby={`${base}-tab-${tab}`} className={styles.panel}>
        {tab === 'terminal' && <Steps steps={data.terminal} />}
        {tab === 'desktop' &&
          (data.desktop && data.desktop.length > 0 ? (
            <Steps steps={data.desktop} />
          ) : (
            data.desktopNote && (
              <p className={styles.text}>
                <RichText text={t(data.desktopNote)} />
              </p>
            )
          ))}
      </div>
      <p className={styles.check}>
        <span className={styles.checkLabel}>{ui.checkItWorked}</span>
        <span>
          <RichText text={t(data.check)} />
        </span>
      </p>
    </section>
  );
}
