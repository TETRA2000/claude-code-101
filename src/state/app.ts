import type { Content } from '../content';
import type { UnitMeta } from '../content/types';
import { detectLang, type Lang } from '../i18n/lang';
import type { Progress } from '../storage/progress';

export type Screen =
  | { name: 'home' }
  | { name: 'learn'; unitKey: string; card: number }
  | { name: 'practice'; unitKey: string };
export interface AppState {
  screen: Screen;
  lang: Lang;
  progress: Progress;
}
export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'openLearn'; unitKey: string }
  | { type: 'gotoCard'; card: number }
  | { type: 'finishLearn'; practice: boolean }
  | { type: 'openPractice'; unitKey: string }
  | { type: 'completePractice'; unitKey: string; xp: number }
  | { type: 'goHome' };

export function initState(p: Progress, browserLanguages: readonly string[]): AppState {
  return { screen: { name: 'home' }, lang: detectLang(p.lang, browserLanguages), progress: p };
}

export function appReducer(content: Content): (s: AppState, a: Action) => AppState {
  const isReady = (key: string) => content.unitByKey(key)?.status === 'ready';
  return (s, a) => {
    switch (a.type) {
      case 'setLang':
        return { ...s, lang: a.lang, progress: { ...s.progress, lang: a.lang } };
      case 'openLearn':
        return isReady(a.unitKey) ? { ...s, screen: { name: 'learn', unitKey: a.unitKey, card: 0 } } : s;
      case 'gotoCard': {
        if (s.screen.name !== 'learn') return s;
        const count = content.bodyOf(s.screen.unitKey)?.cards.length ?? 0;
        const card = Math.max(0, Math.min(Math.trunc(a.card) || 0, count - 1));
        return { ...s, screen: { ...s.screen, card } };
      }
      case 'finishLearn': {
        if (s.screen.name !== 'learn') return s;
        const { unitKey } = s.screen;
        return {
          ...s,
          screen: a.practice ? { name: 'practice', unitKey } : { name: 'home' },
          progress: { ...s.progress, learned: { ...s.progress.learned, [unitKey]: true } },
        };
      }
      case 'openPractice':
        return isReady(a.unitKey) ? { ...s, screen: { name: 'practice', unitKey: a.unitKey } } : s;
      case 'completePractice': {
        if (!isReady(a.unitKey)) return s;
        const gain = Number.isFinite(a.xp) ? Math.max(0, a.xp) : 0;
        return {
          ...s,
          progress: {
            ...s.progress,
            xp: s.progress.xp + gain,
            practiced: { ...s.progress.practiced, [a.unitKey]: true },
          },
        };
      }
      case 'goHome':
        return { ...s, screen: { name: 'home' } };
    }
  };
}

export function suggestedUnit(content: Content, p: Progress): UnitMeta | null {
  return content.units.find((u) => u.status === 'ready' && !p.practiced[u.key]) ?? null;
}
