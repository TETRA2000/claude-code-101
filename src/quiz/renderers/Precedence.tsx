import { useId } from 'react';
import type { PrecedenceItem } from '../../content/types';
import { RichText } from '../../components/RichText';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import styles from './Precedence.module.css';

/** Which file wins? Several settings files set one key; pick the value Claude Code uses. */
export function Precedence({ item, answer, act }: RendererProps<PrecedenceItem>) {
  const { ui, t } = useLang();
  const id = useId();
  return (
    <div className={styles.root}>
      <p className={styles.question}>
        <RichText text={t(item.question)} />
      </p>
      <div className={styles.files}>
        <h3 className={styles.label}>{ui.settingsFilesTitle}</h3>
        {item.files.map((f, i) => (
          <div key={f.scope} className={styles.file} role="group" aria-labelledby={`${id}-${i}`}>
            <div className={styles.chrome}>
              <code id={`${id}-${i}`} className={styles.path}>
                {f.path}
              </code>
              <span className={styles.scope}>{ui.scopeLabel[f.scope]}</span>
            </div>
            <pre className={styles.code}>{f.lines.join('\n')}</pre>
          </div>
        ))}
      </div>
      <div className={styles.opts} role="group" aria-label={ui.precedenceOptions} data-testid="precedence-options">
        {item.opts.map((o, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.opt} ${o.mono ? styles.mono : ''}`}
            aria-pressed={answer.sel === i}
            disabled={answer.checked}
            onClick={() => act({ type: 'select', sel: i })}
          >
            {t(o.text)}
          </button>
        ))}
      </div>
    </div>
  );
}
