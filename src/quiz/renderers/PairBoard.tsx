import { useEffect } from 'react';
import type { DecodeItem, PairsItem } from '../../content/types';
import { CheckIcon, CloseIcon } from '../../components/icons';
import { useLang } from '../../i18n/LangContext';
import { PAIR_MISS_FLASH_MS } from '../../state/rules';
import type { RendererProps } from './Approve';
import { TerminalFrame } from './TerminalFrame';
import styles from './PairBoard.module.css';

type Tone = 'idle' | 'selected' | 'wrong' | 'done';

/** Tap a tile on each side to match them. Pairs and decode complete themselves; no hearts are lost. */
export function PairBoard({ item, answer, act }: RendererProps<PairsItem | DecodeItem>) {
  const { ui, t } = useLang();

  // Clear the mismatch highlight after a moment. A newer pick clears `miss`
  // first, which cancels this timer.
  useEffect(() => {
    if (!answer.miss) return;
    const timer = setTimeout(() => act({ type: 'clearMiss' }), PAIR_MISS_FLASH_MS);
    return () => clearTimeout(timer);
  }, [answer.miss, act]);

  const rows =
    item.type === 'pairs'
      ? item.items.map((p) => ({ id: p.id, left: t(p.left), leftMono: !!p.leftMono, right: t(p.right) }))
      : item.parts.map((p) => ({ id: p.id, left: p.code, leftMono: true, right: t(p.means) }));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const tone = (side: 'left' | 'right', id: string): Tone => {
    if (answer.matched[id]) return 'done';
    if (answer.miss?.[side] === id) return 'wrong';
    if (answer[side] === id) return 'selected';
    return 'idle';
  };

  const column = (side: 'left' | 'right', ids: string[]) => (
    <div className={styles.column}>
      {ids.map((id) => {
        const row = byId.get(id);
        if (!row) return null;
        const tn = tone(side, id);
        const text = side === 'left' ? row.left : row.right;
        const mono = side === 'left' && row.leftMono;
        const status = tn === 'done' ? ui.pairMatched : tn === 'wrong' ? ui.pairNoMatch : '';
        return (
          <button
            key={id}
            type="button"
            className={`${styles.tile} ${mono ? styles.mono : ''} ${tn === 'done' ? styles.done : tn === 'wrong' ? styles.wrong : ''}`}
            disabled={tn === 'done'}
            aria-pressed={tn === 'selected'}
            aria-label={status ? `${text}, ${status}` : text}
            onClick={() => act({ type: 'pickPair', side, id })}
          >
            <span>{text}</span>
            {tn === 'done' && (
              <span className={styles.mark} aria-hidden="true">
                <CheckIcon />
              </span>
            )}
            {tn === 'wrong' && (
              <span className={styles.mark} aria-hidden="true">
                <CloseIcon size={16} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const leftIds = rows.map((r) => r.id);
  return (
    <div className={styles.root}>
      {item.type === 'decode' && (
        <TerminalFrame title="claude">
          <div>
            <span aria-hidden="true">$ </span>
            {item.command}
          </div>
        </TerminalFrame>
      )}
      <div className={styles.columns}>
        {column('left', leftIds)}
        {column('right', item.order)}
      </div>
    </div>
  );
}
