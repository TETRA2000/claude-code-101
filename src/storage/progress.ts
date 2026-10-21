import { isLang, type Lang } from '../i18n/lang';

export interface Progress {
  lang: Lang | null;
  learned: Record<string, true>;
  practiced: Record<string, true>;
  xp: number;
}
export interface ProgressStore {
  load(): Progress;
  save(p: Progress): void;
}

export const STORAGE_KEY = 'cc101.progress.v1';

const empty = (): Progress => ({ lang: null, learned: {}, practiced: {}, xp: 0 });

function flags(v: unknown): Record<string, true> {
  const out: Record<string, true> = {};
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    if (val === true && k !== '__proto__') out[k] = true;
  }
  return out;
}

/** Never throws: corrupt or foreign data yields empty progress, bad fields are dropped. */
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return empty();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return empty();
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return empty();
  const d = data as Record<string, unknown>;
  return {
    lang: isLang(d.lang) ? d.lang : null,
    learned: flags(d.learned),
    practiced: flags(d.practiced),
    xp: typeof d.xp === 'number' && Number.isFinite(d.xp) && d.xp >= 0 ? d.xp : 0,
  };
}

const defaultStorage = (): Storage | undefined => globalThis.localStorage;

export function localProgressStore(getStorage: () => Storage | undefined = defaultStorage): ProgressStore {
  return {
    load() {
      try {
        return parseProgress(getStorage()?.getItem(STORAGE_KEY) ?? null);
      } catch {
        return empty();
      }
    },
    save(p) {
      try {
        getStorage()?.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch {
        /* storage unavailable or full: progress just won't persist */
      }
    },
  };
}
