import type { Dispatch } from 'react';
import { Button } from '../components/Button';
import { CloseIcon } from '../components/icons';
import { LangSwitch } from '../components/LangSwitch';
import { ProgressBar } from '../components/ProgressBar';
import { RichText } from '../components/RichText';
import type { Card, Demo, UnitMeta } from '../content/types';
import { useLang } from '../i18n/LangContext';
import type { Action } from '../state/app';
import { AnatomyDemo } from './demos/AnatomyDemo';
import { ContextDemo } from './demos/ContextDemo';
import { TerminalDemo } from './demos/TerminalDemo';
import styles from './Learn.module.css';

interface Props {
  unit: UnitMeta;
  cards: Card[];
  card: number;
  dispatch: Dispatch<Action>;
}

function DemoView({ demo }: { demo: Demo }) {
  switch (demo.kind) {
    case 'terminal':
      return <TerminalDemo demo={demo} />;
    case 'context':
      return <ContextDemo demo={demo} />;
    case 'anatomy':
      return <AnatomyDemo demo={demo} />;
  }
}

export function Learn({ unit, cards, card, dispatch }: Props) {
  const { ui, t, lang } = useLang();
  const n = cards.length;
  const c = cards[card];
  if (!c) return null;
  const last = card === n - 1;
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.close} aria-label={ui.quit} onClick={() => dispatch({ type: 'goHome' })}>
          <CloseIcon />
        </button>
        <ProgressBar tone="learn" label={`${ui.learn}: ${t(unit.title)} ${card + 1} / ${n}`} value={((card + 1) / n) * 100} />
        <LangSwitch lang={lang} onChange={(l) => dispatch({ type: 'setLang', lang: l })} />
      </header>
      <main className={styles.main}>
        <section className={styles.text}>
          <h1 className={styles.title}>{t(c.title)}</h1>
          {c.body.map((p, i) => (
            <p key={i} className={styles.para}>
              <RichText text={t(p)} />
            </p>
          ))}
          {c.key && (
            <aside className={styles.key}>
              <span className={styles.keyLabel}>{ui.keyIdea}</span>
              <p className={styles.keyText}>
                <RichText text={t(c.key)} />
              </p>
            </aside>
          )}
        </section>
        {c.demo && (
          <section className={styles.demo} key={c.id}>
            <DemoView demo={c.demo} />
          </section>
        )}
      </main>
      <footer className={styles.footer}>
        {card > 0 ? (
          <Button variant="secondary" onClick={() => dispatch({ type: 'gotoCard', card: card - 1 })}>
            {ui.back}
          </Button>
        ) : (
          <span />
        )}
        {last ? (
          <div className={styles.finish}>
            <Button variant="secondary" onClick={() => dispatch({ type: 'finishLearn', practice: false })}>
              {ui.done}
            </Button>
            <Button onClick={() => dispatch({ type: 'finishLearn', practice: true })}>{ui.practiceThis}</Button>
          </div>
        ) : (
          <Button onClick={() => dispatch({ type: 'gotoCard', card: card + 1 })}>{ui.next}</Button>
        )}
      </footer>
    </div>
  );
}
