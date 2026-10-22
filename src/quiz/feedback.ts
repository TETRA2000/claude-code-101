import type { DocRef, Item } from '../content/types';
import { choicesOf } from '../content/approve';
import { t, type Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import { ruleOutcomes } from './grade';
import type { AnswerState } from './types';

export interface FeedbackText {
  ok: boolean;
  title: string;
  headline: string | null;
  /** The chosen option's own feedback; null when it has none. */
  body: string | null;
  explain: string;
  more?: DocRef;
  /** rule: one per test call, whether it got the wanted outcome. */
  checks?: { label: string; ok: boolean }[];
}

export function feedbackFor(item: Item, a: AnswerState, index: number, lang: Lang): FeedbackText {
  const ui = UI[lang];
  const explain = t(item.explain, lang);
  const sel = a.sel;

  let body: string | null = null;
  let headline: string | null = null;
  let checks: FeedbackText['checks'];

  switch (item.type) {
    case 'approve': {
      const choice = sel === null ? undefined : choicesOf(item)[sel];
      const outcome = choice ? item.outcomes[choice] : undefined;
      body = outcome ? t(outcome.feedback, lang) : null;
      if (!a.ok && outcome?.headline) headline = t(outcome.headline, lang);
      break;
    }
    case 'predict':
    case 'precedence':
    case 'setup':
    case 'combo': {
      const fb = sel === null ? undefined : item.opts[sel]?.feedback;
      body = fb ? t(fb, lang) : null;
      break;
    }
    case 'chain':
      if (sel !== null && sel !== item.answer) body = t(sel < item.answer ? item.early : item.late, lang);
      break;
    case 'rule': {
      const got = ruleOutcomes(item, a);
      if (got) {
        checks = item.tests.map((tc, i) => ({
          label: tc.call.tool === 'Bash' ? tc.call.target : `${tc.call.tool} ${tc.call.target}`,
          ok: got[i] === tc.want,
        }));
      }
      break;
    }
    default:
      break;
  }

  const title = a.ok ? (ui.praise[index % ui.praise.length] ?? '') : headline ? ui.breaking : ui.notQuite;
  return { ok: a.ok, title, headline, body, explain, more: item.more, ...(checks ? { checks } : {}) };
}
