import type { Surface } from '../../content/types';
import styles from './PermissionPrompt.module.css';

interface Props {
  surface: Surface;
  tool: string;
  target: string;
  reason: string;
  /** The option lines, in order. The caller builds them from the same list as its answer buttons. */
  options: string[];
  /** Draw the desktop Browser pane site card (F8). */
  pane?: 'browser';
}

/**
 * Read-only picture of a permission prompt. The learner answers with the buttons
 * below it, not here. It draws exactly the `options` it is given, so the picture
 * and the answers can never disagree.
 *
 * Terminal: follows docs/claude-code-facts.md F1 (Bash layout: title, description,
 * command, "This command requires approval", "Do you want to proceed?", numbered
 * options, Esc/Tab footer). The CLI's strings are product output and stay in English;
 * callers pass English options for the terminal. Other tools' layouts are partly
 * UNVERIFIED in F1, so they get only the neutral parts: tool, target, reason, options.
 *
 * Desktop: `pane: 'browser'` draws the Browser pane's first-action card for a site
 * (F8: Allow once / Always allow / Deny). Other desktop prompts are UNVERIFIED (F2),
 * so they render documented parts only (tool, target, reason) as a card with the
 * options the caller passes in the course's own words.
 */
export function PermissionPrompt({ surface, tool, target, reason, options, pane }: Props) {
  if (surface === 'desktop') {
    return (
      <div className={styles.card} data-surface="desktop" data-pane={pane}>
        <span className={styles.cardTool}>{tool}</span>
        <code className={styles.cardTarget}>{target}</code>
        <span className={styles.cardReason}>{reason}</span>
        <ul className={styles.cardOpts}>
          {options.map((label, i) => (
            <li key={i} className={styles.cardOpt}>
              {label}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const isBash = tool === 'Bash';
  return (
    <div className={styles.term} data-surface="terminal">
      <span className={styles.termTitle}>{isBash ? 'Bash command' : tool}</span>
      <div className={styles.termBody}>
        <span className={styles.termReason}>{reason}</span>
        <span className={styles.termTarget}>{target}</span>
      </div>
      {isBash && <span className={styles.termReason}>This command requires approval</span>}
      {isBash && <span>Do you want to proceed?</span>}
      <ol className={styles.termOpts}>
        {options.map((label, i) => (
          <li key={i} className={styles.termOpt}>
            {i === 0 ? '❯ ' : '  '}
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      {isBash && <span className={styles.termReason}>Esc to cancel · Tab to amend</span>}
    </div>
  );
}
