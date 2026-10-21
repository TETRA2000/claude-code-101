import { useState } from 'react';
import type { ChainItem } from '../../content/types';
import { RichText } from '../../components/RichText';
import { CheckIcon, XCircleIcon } from '../../components/icons';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import { BrowserFrame } from './BrowserFrame';
import { TerminalFrame } from './TerminalFrame';
import styles from './Chain.module.css';

export function Chain({ item, answer, act }: RendererProps<ChainItem>) {
  const { ui, t } = useLang();
  const [showHidden, setShowHidden] = useState(false);
  const { scene } = item;
  return (
    <div className={styles.root}>
      <p className={styles.task}>
        <strong>{ui.yourTask}</strong> <RichText text={t(item.task)} />
      </p>
      <div className={styles.cols}>
        <div className={styles.scene}>
          {scene.kind === 'browser' ? (
            <>
              <BrowserFrame scene={scene} showHidden={showHidden} />
              {scene.page.hidden && (
                <button type="button" className={styles.toggle} aria-pressed={showHidden} onClick={() => setShowHidden((v) => !v)}>
                  {showHidden ? ui.hideHidden : ui.showHidden}
                </button>
              )}
            </>
          ) : (
            <TerminalFrame title="claude">
              {scene.lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </TerminalFrame>
          )}
        </div>
        <div className={styles.steps}>
          <h3 className={styles.stepsTitle}>{ui.stepsTitle}</h3>
          {item.steps.map((s, i) => {
            const isAnswer = answer.checked && i === item.answer;
            const isWrong = answer.checked && answer.sel === i && i !== item.answer;
            return (
              <button
                key={i}
                type="button"
                className={`${styles.step} ${isAnswer ? styles.right : ''} ${isWrong ? styles.wrong : ''}`}
                aria-pressed={answer.sel === i}
                disabled={answer.checked}
                onClick={() => act({ type: 'select', sel: i })}
              >
                <span className={styles.mono}>
                  {i + 1}. {s.tool} {s.target}
                </span>
                <span className={styles.why}>{t(s.why)}</span>
                {isAnswer && (
                  <span className={styles.mark}>
                    <CheckIcon size={16} /> {ui.denyHereMark}
                  </span>
                )}
                {isWrong && (
                  <span className={styles.mark}>
                    <XCircleIcon size={16} /> {ui.notThisStepMark}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
