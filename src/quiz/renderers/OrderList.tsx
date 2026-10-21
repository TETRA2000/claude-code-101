import type { OrderItem } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import type { RendererProps } from './Approve';
import styles from './OrderList.module.css';

export function OrderList({ item, answer, act }: RendererProps<OrderItem>) {
  const { ui, t } = useLang();
  const text = new Map(item.steps.map((s) => [s.id, t(s.text)]));
  const last = answer.order.length - 1;
  return (
    <ol className={styles.list}>
      {answer.order.map((id, i) => {
        const label = text.get(id) ?? id;
        return (
          <li key={id} className={styles.row}>
            <span className={styles.num} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.text}>{label}</span>
            <span className={styles.btns}>
              <button
                type="button"
                className={styles.btn}
                aria-label={`${ui.moveUp}: ${label}`}
                disabled={answer.checked || i === 0}
                onClick={() => act({ type: 'move', from: i, to: i - 1 })}
              >
                <span aria-hidden="true">↑</span>
              </button>
              <button
                type="button"
                className={styles.btn}
                aria-label={`${ui.moveDown}: ${label}`}
                disabled={answer.checked || i === last}
                onClick={() => act({ type: 'move', from: i, to: i + 1 })}
              >
                <span aria-hidden="true">↓</span>
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
