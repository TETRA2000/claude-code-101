import type { Surface } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './PermissionPrompt.module.css';

interface Props {
  surface: Surface;
  tool: string;
  target: string;
  reason: string;
  alwaysLabel: string;
}

/**
 * Read-only picture of a permission prompt. The learner answers with the buttons
 * below it, not here.
 *
 * Terminal: follows docs/claude-code-facts.md F1 (Bash layout). The CLI's own
 * strings are product output and stay in English; only `reason` and `alwaysLabel`
 * come from the item.
 *
 * Desktop: F2 marks the desktop shell/web/MCP prompt layout and labels as
 * UNVERIFIED, so this renders documented parts only (tool, target, reason) as a
 * card with neutral option labels in the course's own words. Do not add "real"
 * desktop wording here until F2 is verified.
 */
export function PermissionPrompt({ surface, tool, target, reason, alwaysLabel }: Props) {
  const { ui } = useLang();
  if (surface === 'desktop') {
    return (
      <div className={styles.card} data-surface="desktop">
        <span className={styles.cardTool}>{tool}</span>
        <code className={styles.cardTarget}>{target}</code>
        <span className={styles.cardReason}>{reason}</span>
        <ul className={styles.cardOpts}>
          {[ui.approveYes, alwaysLabel, ui.approveNo].map((label, i) => (
            <li key={i} className={styles.cardOpt}>
              {label}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  // F1: the full layout and option 3 are documented for Bash only. Web fetch, file
  // and MCP tool layouts are partly UNVERIFIED in F1, so other tools get only the
  // neutral parts: tool name, target, reason, and Yes / alwaysLabel / No.
  const isBash = tool === 'Bash';
  const options = isBash ? ['Yes', alwaysLabel, 'Yes, and switch to auto mode', 'No'] : ['Yes', alwaysLabel, 'No'];
  return (
    <div className={styles.term} data-surface="terminal">
      <span className={styles.termTitle}>{isBash ? 'Bash command' : tool}</span>
      <div className={styles.termBody}>
        <span className={styles.termReason}>{reason}</span>
        <span className={styles.termTarget}>{target}</span>
      </div>
      {isBash && <span className={styles.termReason}>This command requires approval</span>}
      <span>Do you want to proceed?</span>
      <ol className={styles.termOpts}>
        {options.map((label, i) => (
          <li key={i} className={styles.termOpt}>
            {i === 0 ? '❯ ' : '  '}
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <span className={styles.termReason}>Esc to cancel{isBash ? ' · Tab to amend' : ''}</span>
    </div>
  );
}
