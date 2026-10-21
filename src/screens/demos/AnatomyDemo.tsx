import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import { PermissionPrompt } from '../../quiz/renderers/PermissionPrompt';
import { TerminalFrame } from '../../quiz/renderers/TerminalFrame';
import styles from './demos.module.css';

type Props = { demo: Extract<Demo, { kind: 'anatomy' }> };

export function AnatomyDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const partNames = { tool: ui.partTool, target: ui.partTarget, reason: ui.partReason, options: ui.partOptions };
  const shared = { tool: demo.tool, target: demo.target, reason: t(demo.reason), alwaysLabel: t(demo.alwaysLabel) };
  return (
    <div className={styles.demo}>
      <div className={styles.surfaces}>
        <figure className={styles.surface}>
          <figcaption className={styles.caption}>{ui.inTerminal}</figcaption>
          <TerminalFrame title="claude">
            <PermissionPrompt surface="terminal" {...shared} />
          </TerminalFrame>
        </figure>
        <figure className={styles.surface}>
          <figcaption className={styles.caption}>{ui.inDesktop}</figcaption>
          <PermissionPrompt surface="desktop" {...shared} />
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
