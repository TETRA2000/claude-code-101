import { useId, useState } from 'react';
import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './ModesDemo.module.css';

type Props = { demo: Extract<Demo, { kind: 'modes' }> };

/**
 * Two views of one mode: the terminal status bar (Shift+Tab cycles it, F4) and the desktop selector.
 * The button is an ordinary button; the real Shift+Tab key keeps moving focus.
 */
export function ModesDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const name = useId();
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState('');
  const cur = demo.modes[index];
  if (!cur) return null;
  const go = (i: number) => {
    setIndex(i);
    const m = demo.modes[i];
    if (m) setAnnounce(ui.modesAnnounce(m.status));
  };
  return (
    <div className={styles.root}>
      <p className={styles.hint}>{ui.modesHint}</p>
      <div className={styles.block}>
        <h3 className={styles.heading}>{ui.modesTerminalTitle}</h3>
        <div className={styles.terminal}>
          <code className={styles.status} data-testid="status-bar">
            {cur.status}
          </code>
          <button type="button" className={styles.press} onClick={() => go((index + 1) % demo.modes.length)}>
            {ui.pressShiftTab}
          </button>
        </div>
        <span className="sr-only" role="status">
          {announce}
        </span>
      </div>
      <div className={styles.block}>
        <h3 className={styles.heading}>{ui.modesDesktopTitle}</h3>
        <div className={styles.radios} role="radiogroup" aria-label={ui.modeSelector}>
          {demo.modes.map((m, i) => (
            <label key={m.mode} className={styles.radio} data-on={i === index ? 'true' : undefined}>
              <input type="radio" name={name} checked={i === index} onChange={() => go(i)} />
              <span>{m.desktop}</span>
            </label>
          ))}
        </div>
      </div>
      <div className={styles.lists}>
        <div className={styles.block}>
          <h3 className={styles.heading}>{ui.modesRunsTitle}</h3>
          <ul className={styles.list}>
            {cur.runs.map((r, i) => (
              <li key={i}>{t(r)}</li>
            ))}
          </ul>
        </div>
        <div className={styles.block}>
          <h3 className={styles.heading}>{ui.modesAsksTitle}</h3>
          <ul className={styles.list}>
            {cur.asks.map((r, i) => (
              <li key={i}>{t(r)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
