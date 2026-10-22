import { useState } from 'react';
import { SCOPE_ORDER, type Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './SettingsDemo.module.css';

type Demo_ = Extract<Demo, { kind: 'settings' }>;
type Props = { demo: Demo_ };
type File_ = Demo_['files'][number];

/**
 * The file that wins for a single-value key: the highest-scope file with a line holding `"<key>":`.
 * `value` is the text after the colon, without a trailing comma. List keys merge instead (F11), so the validator keeps them out.
 */
export function winningFile(key: string, files: readonly File_[]): { file: File_; value: string } | null {
  const needle = `"${key}":`;
  for (const scope of SCOPE_ORDER) {
    const file = files.find((f) => f.scope === scope);
    const line = file?.lines.find((l) => l.includes(needle));
    if (file && line) return { file, value: line.slice(line.indexOf(needle) + needle.length).trim().replace(/,$/, '') };
  }
  return null;
}

/** The settings stack: click a file to see who it affects; the line below shows which value wins. */
export function SettingsDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const files = SCOPE_ORDER.flatMap((s) => demo.files.filter((f) => f.scope === s));
  const shown = files.find((f) => f.scope === open);
  const win = winningFile(demo.key, demo.files);
  return (
    <div className={styles.root}>
      <p className={styles.hint}>{ui.settingsDemoHint}</p>
      <div className={styles.block}>
        <h3 className={styles.heading}>
          {ui.settingsFilesTitle} · {ui.settingsHighest}
        </h3>
        <ul className={styles.files}>
          {files.map((f, i) => (
            <li key={f.scope}>
              <button
                type="button"
                className={styles.file}
                aria-pressed={open === f.scope}
                data-winner={win?.file.scope === f.scope ? 'true' : undefined}
                onClick={() => setOpen(open === f.scope ? null : f.scope)}
              >
                <span className={styles.rank} aria-hidden="true">
                  {i + 1}
                </span>
                <code className={styles.path}>{f.path}</code>
                <span className={styles.scope}>{ui.scopeLabel[f.scope]}</span>
                <pre className={styles.code}>{f.lines.join('\n')}</pre>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.block}>
        <h3 className={styles.heading}>{ui.settingsWhoTitle}</h3>
        <p className={styles.who} aria-live="polite">
          {shown ? t(shown.who) : ui.settingsPickFile}
        </p>
      </div>
      <div className={styles.block}>
        <h3 className={styles.heading}>{ui.settingsWinsTitle}</h3>
        <p className={styles.wins} data-testid="wins">
          {win ? ui.settingsWins(demo.key, win.value, win.file.path) : ui.settingsNoWinner(demo.key)}
        </p>
      </div>
    </div>
  );
}
