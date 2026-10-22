import { choicesOf } from '../content/approve';
import { AUTO_OUTCOMES, type Item, type RuleItem } from '../content/types';
import { outcomeOf, type Outcome } from '../rules/match';
import type { AnswerState } from './types';

export const isAutoGraded = (item: Item): boolean => item.type === 'pairs' || item.type === 'decode';

export function freshAnswer(item: Item | undefined): AnswerState {
  return {
    sel: null,
    list: null,
    picked: [],
    order: item?.type === 'order' ? [...item.start] : [],
    left: null,
    right: null,
    matched: {},
    miss: null,
    misses: 0,
    hintUsed: false,
    checked: false,
    ok: false,
  };
}

/** Whether the Check button is enabled. Pairs and decode have no Check: they complete themselves. */
export function canCheck(item: Item, a: AnswerState): boolean {
  if (a.checked || isAutoGraded(item)) return false;
  switch (item.type) {
    case 'hidden':
    case 'poisoned':
    case 'settings':
    case 'review':
    case 'trim':
      return a.picked.length > 0;
    case 'order':
      return a.order.length > 0;
    case 'rule':
      return a.list !== null && a.sel !== null;
    default:
      return a.sel !== null;
  }
}

export function isCorrect(item: Item, a: AnswerState): boolean {
  switch (item.type) {
    case 'approve': {
      const choice = a.sel === null ? undefined : choicesOf(item)[a.sel];
      return choice !== undefined && item.accept.includes(choice);
    }
    case 'predict':
    case 'chain':
    case 'precedence':
      return a.sel === item.answer;
    case 'automode':
      return a.sel !== null && AUTO_OUTCOMES[a.sel] === item.answer;
    case 'setup':
    case 'combo':
    case 'scopes':
    case 'package':
    case 'inside':
    case 'allowlist':
      return a.sel !== null && item.accept.includes(a.sel);
    case 'hidden':
    case 'poisoned':
    case 'settings':
    case 'review':
    case 'trim': {
      const picked = new Set(a.picked);
      return picked.size === item.answer.length && item.answer.every((i) => picked.has(i));
    }
    case 'order':
      return a.order.length === item.steps.length && a.order.every((id, i) => id === item.steps[i]?.id);
    case 'rule': {
      const got = ruleOutcomes(item, a);
      return got !== null && got.every((o, i) => o === item.tests[i]?.want);
    }
    case 'pairs':
    case 'decode':
      return false;
  }
}

/** Each test's outcome with the chosen rule added to `existing`; null until a list and a pattern are picked. */
export function ruleOutcomes(item: RuleItem, a: Pick<AnswerState, 'list' | 'sel'>): Outcome[] | null {
  const list = a.list === null ? undefined : item.lists[a.list];
  const text = a.sel === null ? undefined : item.patterns[a.sel];
  if (list === undefined || text === undefined) return null;
  const rules = [...(item.existing ?? []), { list, text }];
  return item.tests.map((t) => outcomeOf(rules, t.call));
}
