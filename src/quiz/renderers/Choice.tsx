import type { ChoiceItem, PredictItem } from '../../content/types';
import { RichText } from '../../components/RichText';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import { TerminalFrame } from './TerminalFrame';
import styles from './Choice.module.css';

export function Choice({ item, answer, act }: RendererProps<PredictItem | ChoiceItem>) {
  const { ui, t } = useLang();
  const intro = item.type === 'predict' ? item.situation : item.scenario;
  const code = item.type === 'predict' ? item.code : [];
  const ingredients = item.type === 'combo' ? item.ingredients : undefined;
  const tiles = ingredients
    ? [
        { key: 'private', label: ui.ingredientPrivate, text: ingredients.private },
        { key: 'untrusted', label: ui.ingredientUntrusted, text: ingredients.untrusted },
        { key: 'exit', label: ui.ingredientExit, text: ingredients.exit },
      ]
    : [];
  return (
    <div className={styles.root}>
      {intro && (
        <p className={styles.intro}>
          <RichText text={t(intro)} />
        </p>
      )}
      {code.length > 0 && (
        <TerminalFrame title="claude">
          {code.map((line, i) => (
            <div key={i}>
              <span aria-hidden="true">$ </span>
              {line}
            </div>
          ))}
        </TerminalFrame>
      )}
      {tiles.length > 0 && (
        <ul className={styles.tiles}>
          {tiles.map((x) => (
            <li key={x.key} className={styles.tile}>
              <span className={styles.tileLabel}>{x.label}</span>
              <span>{t(x.text)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.opts}>
        {item.opts.map((o, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.opt} ${'mono' in o && o.mono ? styles.mono : ''}`}
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
