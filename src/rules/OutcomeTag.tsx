import { CheckCircleIcon, LockIcon, QuestionCircleIcon } from '../components/icons';
import { useLang } from '../i18n/LangContext';
import type { Outcome } from './match';
import styles from './OutcomeTag.module.css';

/** An outcome shown with an icon and text, never color alone. */
export function OutcomeTag({ outcome }: { outcome: Outcome }) {
  const { ui } = useLang();
  const text = { runs: ui.outcomeRuns, asks: ui.outcomeAsks, blocked: ui.outcomeBlocked }[outcome];
  const Icon = { runs: CheckCircleIcon, asks: QuestionCircleIcon, blocked: LockIcon }[outcome];
  return (
    <span className={`${styles.tag} ${styles[outcome]}`} data-outcome={outcome}>
      <Icon size={16} />
      <span>{text}</span>
    </span>
  );
}
