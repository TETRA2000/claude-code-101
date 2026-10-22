import type { RuleItem } from '../../content/types';
import { RichText } from '../../components/RichText';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import styles from './RuleBuilder.module.css';

/** Build the rule: pick a list and a pattern. The test calls are revealed in the feedback. */
export function RuleBuilder({ item, answer, act }: RendererProps<RuleItem>) {
  const { ui, t } = useLang();
  const list = answer.list === null ? undefined : item.lists[answer.list];
  const pattern = answer.sel === null ? undefined : item.patterns[answer.sel];
  const existing = item.existing ?? [];
  return (
    <div className={styles.root}>
      <div className={styles.goal}>
        <span className={styles.label}>{ui.ruleGoal}</span>
        <p className={styles.goalText}>
          <RichText text={t(item.goal)} />
        </p>
      </div>
      {existing.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.label}>{ui.rulesInSettings}</h3>
          <ul className={styles.existing}>
            {existing.map((r, i) => (
              <li key={i}>
                <span className={styles.list}>{r.list}</span> <code>{r.text}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.block} role="group" aria-labelledby={`${item.id}-lists`}>
        <h3 id={`${item.id}-lists`} className={styles.label}>
          {ui.rulePickList}
        </h3>
        <div className={styles.row}>
          {item.lists.map((l, i) => (
            <button
              key={l}
              type="button"
              className={`${styles.tile} ${styles.mono}`}
              aria-pressed={answer.list === i}
              disabled={answer.checked}
              onClick={() => act({ type: 'selectList', list: i })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.block} role="group" aria-labelledby={`${item.id}-patterns`}>
        <h3 id={`${item.id}-patterns`} className={styles.label}>
          {ui.rulePickPattern}
        </h3>
        <div className={styles.col}>
          {item.patterns.map((p, i) => (
            <button
              key={p}
              type="button"
              className={`${styles.tile} ${styles.mono}`}
              aria-pressed={answer.sel === i}
              disabled={answer.checked}
              onClick={() => act({ type: 'select', sel: i })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.preview}>
        <span className={styles.label}>{ui.yourRule}</span>{' '}
        <code data-testid="your-rule">
          {list ?? '…'} {pattern ?? '…'}
        </code>
      </p>
    </div>
  );
}
