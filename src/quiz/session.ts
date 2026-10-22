// One practice run as a pure reducer.
import type { Item } from '../content/types';
import { HEARTS_PER_RUN, XP_FIRST_TRY, XP_HINT_COST, XP_RETRY } from '../state/rules';
import { canCheck, freshAnswer, isAutoGraded, isCorrect } from './grade';
import type { AnswerState, Session } from './types';

export type SessionAction =
  | { type: 'start' }
  | { type: 'select'; sel: number }
  | { type: 'selectList'; list: number }
  | { type: 'togglePick'; line: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'pickPair'; side: 'left' | 'right'; id: string }
  | { type: 'clearMiss' }
  | { type: 'useHint' }
  | { type: 'check' }
  | { type: 'next' };

/** Items answered by tapping lines. */
const PICK_TYPES: readonly Item['type'][] = ['hidden', 'poisoned', 'settings', 'review', 'trim'];

export { canCheck, freshAnswer, isAutoGraded, isCorrect };

export function startSession(unitKey: string, items: readonly Item[], hearts = HEARTS_PER_RUN): Session {
  const byId: Record<string, Item> = {};
  for (const it of items) byId[it.id] = it;
  const queue = items.map((it) => it.id);
  return {
    unitKey,
    byId,
    queue,
    idx: 0,
    total: queue.length,
    hearts,
    solved: 0,
    firstTry: 0,
    xp: 0,
    missed: {},
    hinted: {},
    answer: freshAnswer(queue[0] === undefined ? undefined : byId[queue[0]]),
    phase: queue.length ? 'question' : 'done',
  };
}

export function currentItem(s: Session): Item | undefined {
  const id = s.queue[s.idx];
  return id === undefined ? undefined : s.byId[id];
}

/** First-try percentage for the results screen. */
export function accuracy(s: Session): number {
  return s.total ? Math.round((s.firstTry / s.total) * 100) : 0;
}

function withAnswer(s: Session, patch: Partial<AnswerState>): Session {
  return { ...s, answer: { ...s.answer, ...patch } };
}

function grade(s: Session, item: Item, ok: boolean, patch: Partial<AnswerState> = {}): Session {
  const graded = withAnswer(s, { ...patch, checked: true, ok });
  if (ok) {
    const first = !s.missed[item.id];
    const base = first ? XP_FIRST_TRY : XP_RETRY;
    const award = s.hinted[item.id] ? Math.max(0, base - XP_HINT_COST) : base;
    return { ...graded, solved: s.solved + 1, firstTry: s.firstTry + (first ? 1 : 0), xp: s.xp + award };
  }
  return { ...graded, hearts: Math.max(0, s.hearts - 1), missed: { ...s.missed, [item.id]: true }, queue: [...s.queue, item.id] };
}

function pairIds(item: Item): string[] {
  if (item.type === 'pairs') return item.items.map((p) => p.id);
  if (item.type === 'decode') return item.parts.map((p) => p.id);
  return [];
}

function resolvePair(s: Session, item: Item, left: string, right: string): Session {
  if (left === right) {
    const matched = { ...s.answer.matched, [left]: true as const };
    const patch = { matched, left: null, right: null, miss: null };
    return pairIds(item).every((id) => matched[id]) ? grade(s, item, true, patch) : withAnswer(s, patch);
  }
  return withAnswer(s, { miss: { left, right }, left: null, right: null, misses: s.answer.misses + 1 });
}

export function sessionReducer(s: Session, action: SessionAction): Session {
  if (action.type === 'start') return startSession(s.unitKey, s.queue.slice(0, s.total).flatMap((id) => (s.byId[id] ? [s.byId[id]] : [])));

  const item = currentItem(s);
  const a = s.answer;
  if (s.phase !== 'question' || !item) return s;

  switch (action.type) {
    case 'select':
      return a.checked || isAutoGraded(item) ? s : withAnswer(s, { sel: action.sel });

    case 'selectList':
      return item.type !== 'rule' || a.checked ? s : withAnswer(s, { list: action.list });

    case 'togglePick': {
      if (!PICK_TYPES.includes(item.type) || a.checked) return s;
      const picked = a.picked.includes(action.line) ? a.picked.filter((l) => l !== action.line) : [...a.picked, action.line];
      return withAnswer(s, { picked });
    }

    case 'move': {
      const { from, to } = action;
      if (item.type !== 'order' || a.checked) return s;
      if (from < 0 || to < 0 || from >= a.order.length || to >= a.order.length || from === to) return s;
      const order = [...a.order];
      const moved = order.splice(from, 1);
      order.splice(to, 0, ...moved);
      return withAnswer(s, { order });
    }

    case 'pickPair': {
      if (!isAutoGraded(item) || a.checked || a.matched[action.id]) return s;
      if (action.side === 'left') {
        return a.right ? resolvePair(s, item, action.id, a.right) : withAnswer(s, { left: action.id, miss: null });
      }
      return a.left ? resolvePair(s, item, a.left, action.id) : withAnswer(s, { right: action.id, miss: null });
    }

    case 'clearMiss':
      return a.miss ? withAnswer(s, { miss: null }) : s;

    case 'useHint': {
      if (item.type !== 'approve' || !item.decode || a.checked || a.hintUsed) return s;
      return { ...withAnswer(s, { hintUsed: true }), hinted: { ...s.hinted, [item.id]: true } };
    }

    case 'check':
      return canCheck(item, a) ? grade(s, item, isCorrect(item, a)) : s;

    case 'next': {
      if (!a.checked) return s;
      if (s.hearts <= 0) return { ...s, phase: 'out' };
      const idx = s.idx + 1;
      const id = s.queue[idx];
      if (id === undefined) return { ...s, phase: 'done' };
      const answer = { ...freshAnswer(s.byId[id]), hintUsed: !!s.hinted[id] };
      return { ...s, idx, answer };
    }
  }
}
