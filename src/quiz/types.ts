import type { Item } from '../content/types';

/** The learner's in-progress answer to the current item. Fields unused by a type keep their defaults. */
export interface AnswerState {
  /** approve: index into choicesOf(item) · predict/chain/setup/combo: option or step index · rule: pattern index. */
  sel: number | null;
  /** rule: index into item.lists. */
  list: number | null;
  /** hidden: picked line indexes. */
  picked: number[];
  /** order: current arrangement of step ids. */
  order: string[];
  /** pairs/decode: pending picks, matched ids, the mismatch being flashed, and mismatch count. */
  left: string | null;
  right: string | null;
  matched: Record<string, true>;
  miss: { left: string; right: string } | null;
  misses: number;
  hintUsed: boolean;
  checked: boolean;
  ok: boolean;
}

export interface Session {
  unitKey: string;
  byId: Record<string, Item>;
  /** Item ids; wrong answers are appended again. */
  queue: string[];
  idx: number;
  /** Initial queue length; the progress bar is solved / total. */
  total: number;
  hearts: number;
  solved: number;
  firstTry: number;
  xp: number;
  missed: Record<string, true>;
  /** Items whose hint was seen; persists across re-queue. */
  hinted: Record<string, true>;
  answer: AnswerState;
  phase: 'question' | 'done' | 'out';
}
