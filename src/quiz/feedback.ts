import type { Item } from '../content/types';
import { APPROVE_CHOICES } from '../content/types';
import { t, type Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import type { AnswerState } from './types';

export interface FeedbackText {
  ok: boolean;
  title: string;
  headline: string | null;
  /** The chosen option's own feedback; null when it has none. */
  body: string | null;
  explain: string;
}

export function feedbackFor(item: Item, a: AnswerState, index: number, lang: Lang): FeedbackText {
  const ui = UI[lang];
  const explain = t(item.explain, lang);
  const sel = a.sel;

  let body: string | null = null;
  let headline: string | null = null;

  switch (item.type) {
    case 'approve': {
      const choice = sel === null ? undefined : APPROVE_CHOICES[sel];
      const outcome = choice ? item.outcomes[choice] : undefined;
      body = outcome ? t(outcome.feedback, lang) : null;
      if (!a.ok && outcome?.headline) headline = t(outcome.headline, lang);
      break;
    }
    case 'predict':
    case 'setup':
    case 'combo': {
      const fb = sel === null ? undefined : item.opts[sel]?.feedback;
      body = fb ? t(fb, lang) : null;
      break;
    }
    case 'chain':
      if (sel !== null && sel !== item.answer) body = t(sel < item.answer ? item.early : item.late, lang);
      break;
    default:
      break;
  }

  const title = a.ok ? (ui.praise[index % ui.praise.length] ?? '') : headline ? ui.breaking : ui.notQuite;
  return { ok: a.ok, title, headline, body, explain };
}
