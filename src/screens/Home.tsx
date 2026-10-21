import type { Dispatch } from 'react';
import { Button } from '../components/Button';
import { BoltIcon, CheckIcon, LockIcon } from '../components/icons';
import { LangSwitch } from '../components/LangSwitch';
import type { Content } from '../content';
import type { UnitMeta } from '../content/types';
import { useLang } from '../i18n/LangContext';
import { suggestedUnit, type Action, type AppState } from '../state/app';
import styles from './Home.module.css';

export function Home({ content, state, dispatch }: { content: Content; state: AppState; dispatch: Dispatch<Action> }) {
  const { ui, t } = useLang();
  const { progress } = state;
  const next = suggestedUnit(content, progress);

  const openNext = (u: UnitMeta) =>
    dispatch(progress.learned[u.key] ? { type: 'openPractice', unitKey: u.key } : { type: 'openLearn', unitKey: u.key });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>{ui.appTitle}</span>
        <div className={styles.tools}>
          <span className={styles.xp}>
            <BoltIcon />
            {ui.xp(progress.xp)}
          </span>
          <LangSwitch lang={state.lang} onChange={(lang) => dispatch({ type: 'setLang', lang })} />
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.h1}>{ui.heroTitle}</h1>
          <p className={styles.lead}>{ui.heroBody}</p>
        </div>
        {next && (
          <div className={styles.upNext}>
            <span className={styles.badge}>{ui.upNext}</span>
            <div className={styles.upTitle}>{t(next.title)}</div>
            <Button onClick={() => openNext(next)}>{ui.continue}</Button>
          </div>
        )}
      </section>

      <section className={styles.course}>
        <h2 className={styles.h2}>{ui.theCourse}</h2>
        <div className={styles.grid}>
          {content.units.map((u, i) => {
            const ready = u.status === 'ready';
            const done = ready && !!progress.practiced[u.key];
            const suggested = !done && next?.key === u.key;
            const cls = [styles.card, !ready && styles.soon, suggested && styles.suggested].filter(Boolean).join(' ');
            return (
              <article key={u.key} className={cls}>
                <div className={styles.cardTop}>
                  <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                  {done && (
                    <span className={styles.done}>
                      <CheckIcon />
                      {ui.done}
                    </span>
                  )}
                  {suggested && <span className={styles.flag}>{ui.suggested}</span>}
                  {!ready && (
                    <span className={styles.lock}>
                      <LockIcon />
                      {ui.comingSoon}
                    </span>
                  )}
                </div>
                <h3 className={styles.cardTitle}>{t(u.title)}</h3>
                <p className={styles.blurb}>{t(u.blurb)}</p>
                <ul className={styles.chips}>
                  {u.chips.map((c) => (
                    <li key={c} className={styles.chip}>
                      {(() => {
                        const info = content.practiceType(c);
                        return info ? t(info.name) : c;
                      })()}
                    </li>
                  ))}
                </ul>
                {ready && (
                  <>
                    {u.lastChecked && <p className={styles.checked}>{ui.lastChecked(u.lastChecked)}</p>}
                    <div className={styles.actions}>
                      <Button variant="secondary" onClick={() => dispatch({ type: 'openLearn', unitKey: u.key })}>
                        {ui.learn}
                      </Button>
                      <Button variant="secondary" onClick={() => dispatch({ type: 'openPractice', unitKey: u.key })}>
                        {ui.practice}
                      </Button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
