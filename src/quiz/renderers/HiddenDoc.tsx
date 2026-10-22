import { useState } from 'react';
import type { DocSource, HiddenItem } from '../../content/types';
import { CheckIcon, XCircleIcon } from '../../components/icons';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import styles from './HiddenDoc.module.css';

/** Decorative glyph per source; the frame is generic chrome, never a real product look. `tools` is an MCP tool list. */
const GLYPH: Record<DocSource, string> = { notes: '▤', web: '◎', design: '◫', readme: '≡', issue: '●', email: '✉', tools: '⚙' };

export function HiddenDoc({ item, answer, act }: RendererProps<HiddenItem>) {
  const { ui, t } = useLang();
  const [view, setView] = useState<'you' | 'claude'>('you');
  const claude = view === 'claude';
  const tools = item.source === 'tools';
  return (
    <div className={styles.root}>
      <div role="group" aria-label={ui.viewLabel} className={styles.views}>
        <button type="button" className={styles.view} aria-pressed={!claude} onClick={() => setView('you')}>
          {ui.asYouSee}
        </button>
        <button type="button" className={styles.view} aria-pressed={claude} onClick={() => setView('claude')}>
          {ui.asClaudeSees}
        </button>
      </div>
      <div className={[styles.frame, styles[item.source]].filter(Boolean).join(' ')} data-source={item.source}>
        <div className={styles.chrome}>
          <span className={styles.glyph} aria-hidden="true">{GLYPH[item.source]}</span>
          <span className={styles.chromeTitle}>{t(item.title)}</span>
          <span className={styles.location}>{item.location}</span>
        </div>
        <div className={claude ? styles.rawBody : styles.body} role={tools ? 'list' : undefined}>
          {item.lines.map((l, i) => {
            const picked = answer.picked.includes(i);
            const isAnswer = item.answer.includes(i);
            const notDrawn = !claude && !answer.checked && (l.hidden === 'comment' || l.hidden === 'alt');
            if (notDrawn) return null;
            const concealed = !claude && !answer.checked && (l.hidden === 'white' || l.hidden === 'tiny');
            const right = answer.checked && isAnswer;
            const wrong = answer.checked && picked && !isAnswer;
            const text = claude ? `${l.raw?.before ?? ''}${t(l.text)}${l.raw?.after ?? ''}` : t(l.text);
            const cls = [
              styles.line,
              claude ? styles.mono : styles[l.style],
              claude && l.hidden ? styles.tinted : '',
              concealed ? styles[l.hidden as 'white' | 'tiny'] : '',
              right ? styles.right : '',
              wrong ? styles.wrong : '',
            ]
              .filter(Boolean)
              .join(' ');
            const line = (
              <button
                key={i}
                type="button"
                className={cls}
                aria-pressed={picked}
                disabled={answer.checked}
                aria-label={concealed ? ui.blankLine(i + 1) : undefined}
                data-concealed={concealed ? 'true' : undefined}
                onClick={() => act({ type: 'togglePick', line: i })}
              >
                {l.tool !== undefined && (
                  <code className={styles.toolName} data-tool-name aria-hidden={concealed ? 'true' : undefined}>
                    {l.tool}
                  </code>
                )}
                <span className={styles.text} aria-hidden={concealed ? 'true' : undefined}>{text}</span>
                {right && (
                  <span className={styles.mark}>
                    <CheckIcon size={16} /> {ui.hiddenOrderMark}
                  </span>
                )}
                {wrong && (
                  <span className={styles.mark}>
                    <XCircleIcon size={16} /> {ui.notAnOrderMark}
                  </span>
                )}
              </button>
            );
            return tools ? (
              <div key={i} role="listitem">
                {line}
              </div>
            ) : (
              line
            );
          })}
        </div>
      </div>
    </div>
  );
}
