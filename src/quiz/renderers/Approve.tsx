import { APPROVE_CHOICES, type ApproveItem, type Item } from '../../content/types';
import { Button } from '../../components/Button';
import { RichText } from '../../components/RichText';
import { useLang } from '../../i18n/LangContext';
import { XP_HINT_COST } from '../../state/rules';
import type { AnswerState } from '../types';
import type { SessionAction } from '../session';
import { PermissionPrompt } from './PermissionPrompt';
import { TerminalFrame } from './TerminalFrame';
import styles from './Approve.module.css';

export interface RendererProps<I extends Item> {
  item: I;
  answer: AnswerState;
  act: (a: SessionAction) => void;
}

export function Approve({ item, answer, act }: RendererProps<ApproveItem>) {
  const { ui, t } = useLang();
  const labels = [ui.approveYes, t(item.alwaysLabel), ui.approveNo];
  const prompt = (
    <PermissionPrompt
      surface={item.surface}
      tool={item.tool}
      target={item.target}
      reason={t(item.reason)}
      alwaysLabel={t(item.alwaysLabel)}
    />
  );
  return (
    <div className={styles.root}>
      <p className={styles.task}>
        <strong>{ui.yourTask}</strong> <RichText text={t(item.task)} />
      </p>
      <div className={styles.scene}>
        <p className={styles.narration}>
          <RichText text={t(item.narration)} />
        </p>
        {item.surface === 'terminal' ? <TerminalFrame title="claude">{prompt}</TerminalFrame> : prompt}
      </div>
      <div className={styles.answers}>
        {APPROVE_CHOICES.map((c, i) => (
          <button
            key={c}
            type="button"
            className={styles.answer}
            aria-pressed={answer.sel === i}
            disabled={answer.checked}
            onClick={() => act({ type: 'select', sel: i })}
          >
            <span className={styles.num} aria-hidden="true">{i + 1}</span>
            <span className={styles.label}>{labels[i]}</span>
          </button>
        ))}
      </div>
      {item.decode && !answer.hintUsed && !answer.checked && (
        <Button variant="secondary" className={styles.hint} onClick={() => act({ type: 'useHint' })}>
          {ui.decodeHint(XP_HINT_COST)}
        </Button>
      )}
      {item.decode && answer.hintUsed && (
        <section className={styles.pieces} aria-label={ui.piecesTitle}>
          <h3 className={styles.piecesTitle}>{ui.piecesTitle}</h3>
          {item.decode.map((d, i) => (
            <div key={i} className={styles.piece}>
              <code className={styles.pieceCode}>{d.code}</code>
              <span>{t(d.means)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
