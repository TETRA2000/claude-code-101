// The boss run (unit 13) as a pure reducer: a timed queue of approve prompts, one answer each, then a recap.
import { choicesOf } from '../content/approve';
import type { ApproveChoice, ApproveItem } from '../content/types';
import { XP_FIRST_TRY } from '../state/rules';

export const BOSS_SECONDS = 60;

export interface BossAnswer {
  id: string;
  choice: ApproveChoice;
  ok: boolean;
}

export interface BossState {
  byId: Record<string, ApproveItem>;
  queue: string[];
  idx: number;
  /** Length of a run; `start` resets `left` to this. */
  seconds: number;
  left: number;
  answers: BossAnswer[];
  phase: 'intro' | 'run' | 'recap';
}

export type BossAction = { type: 'start' } | { type: 'answer'; choice: ApproveChoice } | { type: 'tick' };

export function startBoss(items: readonly ApproveItem[], seconds = BOSS_SECONDS): BossState {
  const byId: Record<string, ApproveItem> = {};
  for (const it of items) byId[it.id] = it;
  return { byId, queue: items.map((it) => it.id), idx: 0, seconds, left: seconds, answers: [], phase: 'intro' };
}

export function bossCurrent(s: BossState): ApproveItem | undefined {
  const id = s.queue[s.idx];
  return id === undefined ? undefined : s.byId[id];
}

/** Yes, "don't ask again" and "switch to auto mode" all let the action run; only No stops it. */
export const isAllowed = (c: ApproveChoice): boolean => c !== 'no';

export const bossRight = (s: BossState): number => s.answers.filter((a) => a.ok).length;

/** Every prompt is answered once, so each right answer is a first-try answer (XP_FIRST_TRY). */
export const bossXp = (s: BossState): number => bossRight(s) * XP_FIRST_TRY;

export function bossReducer(s: BossState, a: BossAction): BossState {
  switch (a.type) {
    case 'start':
      if (s.phase === 'run') return s;
      return { ...s, idx: 0, left: s.seconds, answers: [], phase: s.queue.length ? 'run' : 'recap' };

    case 'tick': {
      if (s.phase !== 'run') return s;
      const left = Math.max(0, s.left - 1);
      return { ...s, left, phase: left === 0 ? 'recap' : 'run' };
    }

    case 'answer': {
      const item = bossCurrent(s);
      if (s.phase !== 'run' || !item || !choicesOf(item).includes(a.choice)) return s;
      const answers = [...s.answers, { id: item.id, choice: a.choice, ok: item.accept.includes(a.choice) }];
      const idx = s.idx + 1;
      return { ...s, answers, idx, phase: idx >= s.queue.length ? 'recap' : 'run' };
    }
  }
}
