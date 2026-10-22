import { AUTO_OUTCOMES, type AutoModeItem, type AutoOutcome } from '../../content/types';
import { RichText } from '../../components/RichText';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import { TerminalFrame } from './TerminalFrame';
import styles from './AutoMode.module.css';

/** Would auto mode stop this? Read the request, the action and the setup, then predict the outcome (F4, F16). */
export function AutoMode({ item, answer, act }: RendererProps<AutoModeItem>) {
  const { ui, t } = useLang();
  const label: Record<AutoOutcome, string> = { runs: ui.autoRuns, blocked: ui.autoBlocked, asks: ui.autoAsks };
  return (
    <div className={styles.root}>
      <p className={styles.caption}>{item.surface === 'terminal' ? ui.inTerminal : ui.inDesktop}</p>
      <p className={styles.request}>
        <span className={styles.label}>{ui.autoRequestLabel}</span>
        <RichText text={t(item.request)} />
      </p>
      <TerminalFrame title="claude">
        <div>
          <span className={styles.tool}>{item.action.tool}</span> <span className={styles.target}>{item.action.target}</span>
        </div>
      </TerminalFrame>
      <div className={styles.setup}>
        <h3 className={styles.label}>{ui.autoSetupLabel}</h3>
        <ul className={styles.list}>
          {item.setup.map((s, i) => (
            <li key={i}>
              <RichText text={t(s)} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.opts} role="group" aria-label={ui.autoOptions}>
        {AUTO_OUTCOMES.map((o, i) => (
          <button
            key={o}
            type="button"
            className={styles.opt}
            aria-pressed={answer.sel === i}
            disabled={answer.checked}
            onClick={() => act({ type: 'select', sel: i })}
          >
            {label[o]}
          </button>
        ))}
      </div>
    </div>
  );
}
