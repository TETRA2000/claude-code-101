import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import { UI } from '../../i18n/ui';
import { PermissionPrompt } from '../../quiz/renderers/PermissionPrompt';
import { TerminalFrame } from '../../quiz/renderers/TerminalFrame';
import styles from './demos.module.css';

type Props = { demo: Extract<Demo, { kind: 'anatomy' }> };

export function AnatomyDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const partNames = { tool: ui.partTool, target: ui.partTarget, reason: ui.partReason, options: ui.partOptions };
  const shared = { tool: demo.tool, target: demo.target, reason: t(demo.reason) };
  // F1: the terminal Bash prompt's four options, in Claude Code's own English.
  const en = UI.en;
  const terminalOptions = [en.approveYes, demo.alwaysLabel.en, en.approveAuto, en.approveNo];
  // Desktop shell prompts are UNVERIFIED (F2): neutral course labels, and never auto.
  const desktopOptions = [ui.approveYes, t(demo.alwaysLabel), ui.approveNo];
  return (
    <div className={styles.demo}>
      <div className={styles.surfaces}>
        <figure className={styles.surface}>
          <figcaption className={styles.caption}>{ui.inTerminal}</figcaption>
          <TerminalFrame title="claude">
            <PermissionPrompt surface="terminal" {...shared} options={terminalOptions} />
          </TerminalFrame>
        </figure>
        <figure className={styles.surface}>
          <figcaption className={styles.caption}>{ui.inDesktop}</figcaption>
          <PermissionPrompt surface="desktop" {...shared} options={desktopOptions} />
        </figure>
      </div>
      <h3 className={styles.notesTitle}>{ui.notesTitle}</h3>
      <ol className={styles.notes}>
        {demo.notes.map((n, i) => (
          <li key={i} className={styles.note2}>
            <span className={styles.num} aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <strong>{partNames[n.part]}.</strong> {t(n.text)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
