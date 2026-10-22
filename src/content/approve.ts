import type { Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import type { ApproveChoice, ApproveItem } from './types';

const DEFAULT_CHOICES: readonly ApproveChoice[] = ['yes', 'always', 'no'];

/** The answers an approve item offers, in prompt order. `AnswerState.sel` indexes this list. */
export function choicesOf(item: ApproveItem): ApproveChoice[] {
  return [...(item.choices ?? DEFAULT_CHOICES)];
}

/**
 * One label per `choicesOf(item)`, in the same order. The answer buttons and the drawn
 * prompt both come from this list, so they always match. Callers pass `'en'` to draw the
 * terminal prompt, whose wording is Claude Code's own (F1).
 */
export function choiceLabels(item: ApproveItem, lang: Lang): string[] {
  const ui = UI[lang];
  const pane: Partial<Record<ApproveChoice, string>> = { yes: ui.paneAllowOnce, always: ui.paneAlwaysAllow, no: ui.paneDeny };
  const plain: Record<ApproveChoice, string> = {
    yes: ui.approveYes,
    always: item.alwaysLabel?.[lang] ?? ui.approveAlways,
    auto: ui.approveAuto,
    no: ui.approveNo,
  };
  return choicesOf(item).map((c) => (item.pane === 'browser' ? pane[c] : undefined) ?? plain[c]);
}
