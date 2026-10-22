import { useId } from 'react';
import type { SettingsItem } from '../../content/types';
import { CheckIcon, XCircleIcon } from '../../components/icons';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import styles from './SettingsFile.module.css';

/** Fix the settings: a settings file whose lines are buttons. Tap the wrong or dangerous ones, then Check. */
export function SettingsFile({ item, answer, act }: RendererProps<SettingsItem>) {
  const { ui, t } = useLang();
  const titleId = useId();
  return (
    <div className={styles.root}>
      {item.header && (
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>{item.header.title}</h3>
          <ul className={styles.headerRows}>
            {item.header.rows.map((r, i) => (
              <li key={i}>{t(r)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.panel} role="group" aria-labelledby={titleId} data-settings-file>
        <div className={styles.chrome}>
          <code id={titleId} className={styles.file}>
            {item.file}
          </code>
          {item.scope && <span className={styles.scope}>{ui.scopeLabel[item.scope]}</span>}
        </div>
        <div className={styles.lines}>
          {item.lines.map((line, i) => {
            const picked = answer.picked.includes(i);
            const isAnswer = item.answer.includes(i);
            const right = answer.checked && isAnswer;
            const wrong = answer.checked && picked && !isAnswer;
            const note = answer.checked && (picked || isAnswer) ? item.notes?.[String(i)] : undefined;
            const cls = [styles.line, right ? styles.right : '', wrong ? styles.wrong : ''].filter(Boolean).join(' ');
            return (
              <div key={i} className={styles.row}>
                <button type="button" className={cls} aria-pressed={picked} disabled={answer.checked} onClick={() => act({ type: 'togglePick', line: i })}>
                  <span className={styles.no} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.text}>{line === '' ? ' ' : line}</span>
                  {right && (
                    <span className={styles.mark}>
                      <CheckIcon size={16} /> {ui.settingsProblemMark}
                    </span>
                  )}
                  {wrong && (
                    <span className={styles.mark}>
                      <XCircleIcon size={16} /> {ui.settingsFineMark}
                    </span>
                  )}
                </button>
                {note && <p className={styles.note}>{t(note)}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
