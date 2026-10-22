import { useId, useState } from 'react';
import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import { outcomeOf, parseRule, type Rule, type RuleList } from '../../rules/match';
import { OutcomeTag } from '../../rules/OutcomeTag';
import styles from './RulesDemo.module.css';

type Props = { demo: Extract<Demo, { kind: 'rules' }> };
const LISTS: readonly RuleList[] = ['allow', 'ask', 'deny'];

/** Rule tester: type one rule, see what each sample call would do. Malformed text changes nothing. */
export function RulesDemo({ demo }: Props) {
  const { ui } = useLang();
  const id = useId();
  const [list, setList] = useState<RuleList>('deny');
  const [text, setText] = useState('');
  const typed = text.trim() !== '';
  const understood = typed && parseRule(text) !== null;
  const rules: Rule[] = understood ? [...demo.rules, { list, text }] : demo.rules;
  return (
    <div className={styles.root}>
      <p className={styles.hint}>{ui.rulesHint}</p>
      {demo.rules.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.heading}>{ui.rulesInSettings}</h3>
          <ul className={styles.rules}>
            {demo.rules.map((r, i) => (
              <li key={i} className={styles.rule}>
                <span className={styles.list}>{r.list}</span> <code>{r.text}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor={`${id}-list`}>{ui.ruleListLabel}</label>
          <select id={`${id}-list`} className={styles.select} value={list} onChange={(e) => setList(e.target.value as RuleList)}>
            {LISTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className={`${styles.field} ${styles.grow}`}>
          <label htmlFor={`${id}-text`}>{ui.ruleTextLabel}</label>
          <input
            id={`${id}-text`}
            className={styles.input}
            type="text"
            value={text}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            placeholder="Bash(npm run *)"
            aria-invalid={typed && !understood ? true : undefined}
            aria-describedby={`${id}-status`}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
      <p id={`${id}-status`} className={styles.status} aria-live="polite">
        {typed && !understood ? ui.ruleNotUnderstood : ''}
      </p>
      <div className={styles.block}>
        <h3 className={styles.heading}>{ui.rulesCalls}</h3>
        <ul className={styles.calls}>
          {demo.calls.map((c, i) => (
            <li key={i} className={styles.call} data-testid={`call-${c.target}`}>
              <code className={styles.target}>
                {c.tool === 'Bash' ? '$ ' : `${c.tool} `}
                {c.target}
              </code>
              <OutcomeTag outcome={outcomeOf(rules, c)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
