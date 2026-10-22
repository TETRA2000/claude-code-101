import { DOC_SLUGS, LINK_HOSTS } from './docs';
import { isReservedHost, REAL_HOSTS } from './hosts';
import type { Content } from './index';
import { choicesOf } from './approve';
import { APPROVE_CHOICES, type ApproveItem, type Card, type DocRef, type Item, type UnitBody } from './types';

const SECRET = /sk_live_|sk_test_|ntn_|secret_|ghp_|github_pat_|xox[bp]-|AKIA|PRIVATE KEY/;
const URL_IN_TEXT = /https?:\/\/[^\s/?#"'`<>()[\]]+/g;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Calls `fn` for every string reachable from `v`, with its dotted path. */
function walkStrings(v: unknown, path: string, fn: (s: string, path: string) => void): void {
  if (typeof v === 'string') fn(v, path);
  else if (Array.isArray(v)) v.forEach((x, i) => walkStrings(x, join(path, String(i)), fn));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walkStrings(x, join(path, k), fn);
}

/** Calls `fn` for every object that looks like a `Localized` (has `en` or `ja`), with its path. */
function walkLocalized(v: unknown, path: string, fn: (l: Record<string, unknown>, path: string) => void): void {
  if (Array.isArray(v)) v.forEach((x, i) => walkLocalized(x, join(path, String(i)), fn));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('en' in o || 'ja' in o) fn(o, path);
    else for (const [k, x] of Object.entries(o)) walkLocalized(x, join(path, k), fn);
  }
}

const join = (a: string, b: string) => (a ? `${a}.${b}` : b);
const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim() !== '';
const inRange = (n: number, len: number) => Number.isInteger(n) && n >= 0 && n < len;
const isPermutation = (xs: readonly string[], ids: readonly string[]) =>
  xs.length === ids.length && new Set(xs).size === xs.length && xs.every((x) => ids.includes(x));

/** Host of a URL-ish string, with or without a scheme (`collect.example/?d=…`). */
function hostOf(s: string): string {
  const rest = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const authority = rest.split(/[/?#\s]/)[0] ?? '';
  return authority.replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
}

const hostAllowed = (h: string) => isReservedHost(h) || REAL_HOSTS.includes(h);

/** Link fields are checked by `checkRef`, not by the simulation host rule. */
const LINK_KEYS = new Set(['docs', 'more']);
const withoutLinks = (v: unknown): unknown =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter(([k]) => !LINK_KEYS.has(k)))
    : v;

/** Link rules: known slug, or a full URL on an allowed host (github.com only under /anthropics/). */
function checkRef(where: string, ref: DocRef, out: string[]): void {
  if ('slug' in ref) {
    if (!DOC_SLUGS.includes(ref.slug)) out.push(`${where}: unknown doc slug "${ref.slug}"`);
    return;
  }
  let u: URL;
  try {
    u = new URL(ref.url);
  } catch {
    out.push(`${where}: link "${ref.url}" is not a URL`);
    return;
  }
  const host = u.hostname.toLowerCase();
  const isDocs = host === 'code.claude.com';
  if (u.protocol !== 'https:') out.push(`${where}: link "${ref.url}" must be https`);
  else if (isDocs) out.push(`${where}: use a doc slug for ${ref.url}`);
  else if (!LINK_HOSTS.includes(host)) out.push(`${where}: link host "${host}" not allowed`);
  else if (host === 'github.com' && !u.pathname.toLowerCase().startsWith('/anthropics/')) {
    out.push(`${where}: link host "github.com" only allows /anthropics/ paths`);
  }
}

/** Rules 1, 12, 13 for any piece of content: empty text, unlisted hosts, live-looking secrets. */
function checkText(where: string, v: unknown, extraUrls: string[], out: string[]): void {
  walkLocalized(v, '', (l, path) => {
    for (const lang of ['en', 'ja'] as const) {
      if (!nonEmpty(l[lang])) out.push(`${where}: ${lang} text empty at ${path || '(root)'}`);
    }
  });
  const hosts = new Set<string>();
  for (const u of extraUrls) hosts.add(hostOf(u));
  walkStrings(withoutLinks(v), '', (s, path) => {
    for (const m of s.matchAll(URL_IN_TEXT)) hosts.add(hostOf(m[0]));
    if (SECRET.test(s) && !s.includes('FAKE')) out.push(`${where}: secret-looking text without FAKE at ${path}`);
  });
  for (const h of hosts) {
    if (!hostAllowed(h)) out.push(`${where}: host "${h}" is not reserved or in REAL_HOSTS`);
  }
}

/** URLs that appear without a scheme in structured fields. */
function structuredUrls(it: Item): string[] {
  if (it.type !== 'chain') return [];
  const urls = it.steps.filter((s) => s.tool.includes('navigate')).map((s) => s.target);
  if (it.scene.kind === 'browser') urls.push(it.scene.url);
  return urls;
}

/** Code that must never get a copy button. */
export const UNSAFE_SNIPPET = /\brm\b|\bsudo\b|\bcurl\b|\bwget\b|\|\s*(ba)?sh\b|\bchmod\b|--dangerously|bypassPermissions|(^|\s)>/;

/** Try it card rules: terminal steps present, Desktop covered, copy only on safe code. */
function checkTry(card: Card): string[] {
  const t = card.try;
  if (!t) return [];
  const p: string[] = [];
  if (!t.terminal || t.terminal.length === 0) p.push('try needs terminal steps');
  if (!t.desktop?.length && !t.desktopNote) p.push('try needs desktop steps or desktopNote');
  for (const [tab, steps] of [['terminal', t.terminal], ['desktop', t.desktop]] as const) {
    (steps ?? []).forEach((st, i) => {
      if (!st.copy) return;
      if (!st.code) p.push(`try.${tab}.${i}: copy without code`);
      else if (UNSAFE_SNIPPET.test(st.code)) p.push(`try.${tab}.${i}: unsafe snippet has copy`);
    });
  }
  return p;
}

/** Units where "Yes, and switch to auto mode" is never an accepted answer (design: Grading Approve or deny). */
export const AUTO_WRONG_UNITS: readonly string[] = ['permissions', 'injection', 'browser'];

/** Approve rules: choices match the real prompt (F1, F8), outcomes match choices, headlines by danger. */
function checkApprove(it: ApproveItem, unitKey: string): string[] {
  const p: string[] = [];
  const choices = choicesOf(it);
  const ordered = APPROVE_CHOICES.filter((c) => choices.includes(c));
  if (ordered.join() !== choices.join()) p.push(`approve.choices must be distinct and in the order ${APPROVE_CHOICES.join(', ')}`);
  if (!choices.includes('yes') || !choices.includes('no')) p.push('approve.choices must offer yes and no');

  const keys = APPROVE_CHOICES.filter((c) => it.outcomes[c] !== undefined);
  if (keys.join() !== ordered.join()) p.push(`outcomes must match choices (${choices.join(', ')}), has ${keys.join(', ')}`);
  if (choices.includes('always') && !it.alwaysLabel && it.pane !== 'browser') p.push('always is offered but alwaysLabel is missing');

  const bashPrompt = it.surface === 'terminal' && it.tool === 'Bash';
  const autoOffered = choices.includes('auto');
  if (bashPrompt && !it.askRule && !autoOffered) p.push('terminal Bash prompts offer auto (F1)');
  if (autoOffered && !(bashPrompt && !it.askRule)) p.push('auto is offered only on terminal Bash prompts without an ask rule (F1)');
  if (it.pane && it.surface !== 'desktop') p.push('pane: "browser" is a desktop card (F8)');

  if (it.accept.length === 0) p.push('approve.accept is empty');
  const notOffered = it.accept.filter((c) => !choices.includes(c));
  if (notOffered.length) p.push(`approve.accept names choices not offered (${notOffered.join(', ')})`);
  if (it.accept.includes('auto') && AUTO_WRONG_UNITS.includes(unitKey)) p.push('auto is never right while learning');

  const dangerous = it.accept.length === 1 && it.accept[0] === 'no';
  if (dangerous) {
    const missing = choices.filter((c) => c !== 'no' && !it.outcomes[c]?.headline);
    if (missing.length) p.push(`dangerous approve needs a headline on ${missing.join(', ')}`);
  }
  if (it.accept.includes('yes')) {
    const withHeadline = APPROVE_CHOICES.filter((c) => it.outcomes[c]?.headline);
    if (withHeadline.length) p.push(`harmless approve must not have a headline (${withHeadline.join(', ')})`);
  }
  return p;
}

/** Rules 3–11 and 18: type-specific checks. */
function checkItem(it: Item, unitKey: string): string[] {
  const p: string[] = [];
  switch (it.type) {
    case 'approve':
      p.push(...checkApprove(it, unitKey));
      break;
    case 'predict':
      if (!inRange(it.answer, it.opts.length)) p.push(`predict.answer ${it.answer} out of range`);
      else
        it.opts.forEach((o, i) => {
          if (i !== it.answer && !o.feedback) p.push(`predict option ${i} needs feedback`);
        });
      break;
    case 'combo': {
      const removing = it.opts.flatMap((o, i) => (o.removes ? [i] : []));
      const accept = [...it.accept].sort((a, b) => a - b);
      if (accept.join() !== removing.join()) {
        p.push(`combo.accept [${it.accept.join(', ')}] must equal options with removes [${removing.join(', ')}]`);
      }
      break;
    }
    case 'hidden':
      if (it.answer.length === 0) p.push('hidden.answer is empty');
      else if (!it.answer.every((n) => inRange(n, it.lines.length))) p.push('hidden.answer out of range');
      break;
    case 'chain':
      if (!inRange(it.answer, it.steps.length)) p.push(`chain.answer ${it.answer} out of range`);
      break;
    case 'order': {
      const ids = it.steps.map((s) => s.id);
      if (!isPermutation(it.start, ids)) p.push('order.start is not a permutation of step ids');
      else if (it.start.join() === ids.join()) p.push('order.start is already solved');
      break;
    }
    case 'pairs':
      if (it.items.length !== 4) p.push(`pairs needs 4 items, has ${it.items.length}`);
      if (!isPermutation(it.order, it.items.map((x) => x.id))) p.push('pairs.order is not a permutation of ids');
      break;
    case 'decode':
      if (it.parts.length < 3 || it.parts.length > 6) p.push(`decode needs 3–6 parts, has ${it.parts.length}`);
      if (!isPermutation(it.order, it.parts.map((x) => x.id))) p.push('decode.order is not a permutation of ids');
      break;
    case 'setup':
      break;
  }
  return p;
}

export const DOCS_RANGE = [3, 8] as const;

/** Transitional size ranges for ready units. */
export const CARD_RANGE = [3, 7] as const;
export const ITEM_RANGE = [8, 14] as const;

/** Returns every problem found; an empty array means the content is valid. */
export function validateContent(c: Content): string[] {
  const out: string[] = [];
  const typeKeys = new Set(c.practiceTypes.map((t) => t.key));
  const seenIds = new Map<string, string>();

  for (const pt of c.practiceTypes) checkText(`types/${pt.key}`, pt, [], out);

  for (const u of c.units) {
    checkText(u.key, u, [], out);
    for (const d of u.docs ?? []) checkRef(u.key, d.ref, out);
    for (const chip of u.chips) {
      if (!typeKeys.has(chip)) out.push(`${u.key}: chip "${chip}" is not a practice type`);
    }

    const body: UnitBody | undefined = c.bodyOf(u.key);
    if (u.status === 'ready') {
      if (!body) out.push(`${u.key}: ready unit has no body file`);
      if (!u.lastChecked || !DATE.test(u.lastChecked)) out.push(`${u.key}: lastChecked must be YYYY-MM-DD`);
      if (!u.linksChecked || !DATE.test(u.linksChecked)) out.push(`${u.key}: linksChecked must be YYYY-MM-DD`);
      const nd = u.docs?.length ?? 0;
      if (nd < DOCS_RANGE[0] || nd > DOCS_RANGE[1]) out.push(`${u.key}: ready unit needs ${DOCS_RANGE[0]}–${DOCS_RANGE[1]} docs, has ${nd}`);
      if (body) {
        const nc = body.cards.length;
        const ni = body.items.length;
        if (nc < CARD_RANGE[0] || nc > CARD_RANGE[1]) out.push(`${u.key}: ready unit needs ${CARD_RANGE[0]}–${CARD_RANGE[1]} cards, has ${nc}`);
        if (ni < ITEM_RANGE[0] || ni > ITEM_RANGE[1]) out.push(`${u.key}: ready unit needs ${ITEM_RANGE[0]}–${ITEM_RANGE[1]} items, has ${ni}`);
      }
    } else if (body) {
      out.push(`${u.key}: body file for a "${u.status}" unit`);
    }
    if (!body) continue;

    for (const card of body.cards) {
      checkText(`${u.key}/${card.id}`, card, [], out);
      if (card.more) checkRef(`${u.key}/${card.id}`, card.more, out);
      for (const msg of checkTry(card)) out.push(`${u.key}/${card.id}: ${msg}`);
    }
    for (const it of body.items) {
      const where = `${u.key}/${it.id}`;
      const prev = seenIds.get(it.id);
      if (prev) out.push(`${where}: duplicate item id (also in ${prev})`);
      else seenIds.set(it.id, u.key);
      checkText(where, it, structuredUrls(it), out);
      if (it.more) checkRef(where, it.more, out);
      for (const msg of checkItem(it, u.key)) out.push(`${where}: ${msg}`);
    }
  }
  return out;
}
