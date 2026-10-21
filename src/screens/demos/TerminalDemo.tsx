import { useState } from 'react';
import type { Demo } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import { TerminalFrame } from '../../quiz/renderers/TerminalFrame';
import styles from './demos.module.css';

type Cmd = Extract<Demo, { kind: 'terminal' }>['commands'][number];
type Props = { demo: Extract<Demo, { kind: 'terminal' }> };
const KEEP = 4;

export function TerminalDemo({ demo }: Props) {
  const { ui, t } = useLang();
  const [runs, setRuns] = useState<{ n: number; cmd: Cmd }[]>([]);
  const [count, setCount] = useState(0);
  const run = (cmd: Cmd) => {
    setRuns((r) => [...r, { n: count, cmd }].slice(-KEEP));
    setCount(count + 1);
  };
  return (
    <div className={styles.demo}>
      <p className={styles.hint}>{ui.tryCommand}</p>
      <div className={styles.cmds}>
        {demo.commands.map((c, i) => (
          <button key={i} type="button" className={styles.cmdBtn} onClick={() => run(c)}>
            {c.cmd}
          </button>
        ))}
        <button type="button" className={styles.clearBtn} onClick={() => setRuns([])}>
          {ui.clear}
        </button>
      </div>
      <TerminalFrame title={demo.cwd}>
        {runs.map((r) => (
          <div key={r.n} data-testid="run" className={styles.run}>
            <div>
              <span className={styles.prompt}>$ </span>
              {r.cmd.cmd}
            </div>
            {r.cmd.output.map((o, j) => (
              <div key={j} className={o.secret ? styles.secret : undefined}>
                <span>{o.text}</span>
                {o.note && <span className={styles.note}>{t(o.note)}</span>}
              </div>
            ))}
          </div>
        ))}
      </TerminalFrame>
    </div>
  );
}
