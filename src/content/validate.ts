import { DOC_SLUGS, LINK_HOSTS } from './docs';
import { isReservedHost, REAL_HOSTS } from './hosts';
import type { Content } from './index';
import { choicesOf } from './approve';
import { outcomeOf, parseRule, splitCompound, type Call } from '../rules/match';
import { APPROVE_CHOICES, AUTO_OUTCOMES, ITEM_TYPES, type AutoModeItem, type ApproveItem, type Card, type ChoiceItem, type DocRef, type HiddenItem, type Item, type PrecedenceItem, type RuleItem, type SettingsItem, type UnitBody } from './types';

const SECRET = /sk_live_|sk_test_|ntn_|secret_|ghp_|github_pat_|xox[bp]-|AKIA|PRIVATE KEY/;
const URL_IN_TEXT = /https?:\/\/[^\s/?#"'`<>()[\]]+/g;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare hostname with no scheme (`collect.example`, `*.evil.example`, `api.example.com:443`): 2+ lowercase labels
 * ending in a 2+ letter label. Not matched: part of a longer word or path label, a dotted key followed by `:`
 * (`"sandbox.network": …`, `scripts.postinstall: …`), and file names (see FILE_EXTS).
 */
const BARE_HOST = /(?<![\w.-])(?:\*\.)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(?![\w-]|\.[\w-]|["']?\s*:(?!\d))/g;
/** Last labels that mean a file name, not a host (`settings.json`, `CLAUDE.md`, `history.jsonl`). */
export const FILE_EXTS: ReadonlySet<string> = new Set(
  ('json jsonl ndjson md mdx ts tsx js jsx mjs cjs sh bash zsh txt yml yaml toml lock lockb env log py css html htm ' +
    'pub pem key sock conf cfg ini xml csv pdf png jpg jpeg gif svg zip gz tar tgz rs go rb java php sql db local bak tmp ' +
    'xlsx xls docx pptx wasm exe dmg pkg deb rpm whl map').split(' '),
);

/** Hosts written without a scheme in `s`, wildcards stripped (`*.collect.example` → `collect.example`). */
export function bareHosts(s: string): string[] {
  return [...s.matchAll(BARE_HOST)].map((m) => m[1] ?? '').filter((h) => !FILE_EXTS.has(h.slice(h.lastIndexOf('.') + 1)));
}

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

/** Rules 1, 12, 13 for any piece of content: empty text, unlisted hosts (in URLs and bare), live-looking secrets. */
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
    for (const h of bareHosts(s)) hosts.add(h);
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

/** Wrappers Claude Code strips before matching (F12); the matcher does not. */
const WRAPPERS: readonly string[] = ['timeout', 'time', 'nice', 'nohup', 'stdbuf', 'command', 'builtin', 'noglob', 'xargs'];
/** Substitution, subshells, process substitution, groups and redirects: not modeled by src/rules/match.ts. */
export const UNMODELED_SHELL = /\$\(|`|[()<>{}]/;

/**
 * Whether a Bash command uses a form the rule matcher does not model, so its outcome could be wrong:
 * UNMODELED_SHELL, or a part whose first word is a wrapper, an `X=y` assignment, or `git` (read-only git, F14).
 */
export function usesUnmodeledShell(cmd: string): boolean {
  if (UNMODELED_SHELL.test(cmd)) return true;
  return splitCompound(cmd).some((part) => {
    const w = part.split(/\s+/)[0] ?? '';
    return WRAPPERS.includes(w) || w === 'git' || /^[A-Za-z_][A-Za-z0-9_]*=/.test(w);
  });
}

function checkCalls(calls: Call[]): string[] {
  return calls
    .filter((c) => c.tool === 'Bash' && usesUnmodeledShell(c.target))
    .map((c) => `call uses a shell form this model doesn't cover: ${c.target}`);
}

/** Build the rule: parts present and parseable, at least one right and one wrong (list, pattern) pair. */
function checkRule(it: RuleItem): string[] {
  const p: string[] = [];
  if (it.tests.length === 0) p.push('rule.tests is empty');
  if (it.lists.length === 0) p.push('rule.lists is empty');
  if (it.patterns.length === 0) p.push('rule.patterns is empty');
  for (const pat of it.patterns) if (!parseRule(pat)) p.push(`rule pattern "${pat}" does not parse`);
  for (const r of it.existing ?? []) if (!parseRule(r.text)) p.push(`existing rule "${r.text}" does not parse`);
  p.push(...checkCalls(it.tests.map((t) => t.call)));
  if (p.length) return p;
  let right = 0;
  let wrong = 0;
  for (const list of it.lists) {
    for (const text of it.patterns) {
      const rules = [...(it.existing ?? []), { list, text }];
      if (it.tests.every((t) => outcomeOf(rules, t.call) === t.want)) right++;
      else wrong++;
    }
  }
  if (right === 0) p.push('rule item has no solution');
  if (wrong === 0) p.push('rule item has no wrong answer');
  return p;
}

/** Duplicate scopes among a list of settings files. */
function duplicateScopes(files: readonly { scope: string }[]): string[] {
  const seen = new Set<string>();
  const p: string[] = [];
  for (const f of files) {
    if (seen.has(f.scope)) p.push(`duplicate scope "${f.scope}"`);
    seen.add(f.scope);
  }
  return p;
}

/** Fix the settings (and review, trim): answer lines exist, notes point at real lines. */
function checkSettings(it: SettingsItem): string[] {
  const p: string[] = [];
  if (it.lines.length === 0) p.push('settings.lines is empty');
  if (it.answer.length === 0) p.push('settings.answer is empty');
  else if (!it.answer.every((n) => inRange(n, it.lines.length))) p.push('settings.answer out of range');
  for (const k of Object.keys(it.notes ?? {})) {
    if (!/^\d+$/.test(k) || !inRange(Number(k), it.lines.length)) p.push(`settings.notes key "${k}" is not a line index`);
  }
  return p;
}

/** Pick the setup and the wave 2 choice types: a non-empty accept in range, and a panel with lines. */
function checkChoice(it: ChoiceItem): string[] {
  const p: string[] = [];
  if (it.accept.length === 0) p.push(`${it.type}.accept is empty`);
  else if (!it.accept.every((n) => inRange(n, it.opts.length))) p.push(`${it.type}.accept out of range`);
  if (it.panel && it.panel.lines.length === 0) p.push('panel needs lines');
  return p;
}

/** Find the hidden order (and poisoned): answer lines exist; a tool list names every tool; poisoned is a tool list. */
function checkHidden(it: HiddenItem): string[] {
  const p: string[] = [];
  if (it.answer.length === 0) p.push(`${it.type}.answer is empty`);
  else if (!it.answer.every((n) => inRange(n, it.lines.length))) p.push(`${it.type}.answer out of range`);
  if (it.type === 'poisoned' && it.source !== 'tools') p.push('poisoned needs source "tools"');
  it.lines.forEach((l, i) => {
    if (it.source === 'tools' && !nonEmpty(l.tool)) p.push(`tools line ${i} needs a tool name`);
    if (it.source !== 'tools' && l.tool !== undefined) p.push(`line ${i} has a tool name, but source is "${it.source}", not "tools"`);
  });
  return p;
}

/** Which file wins: answer in range, every wrong option explains itself, one file per scope. */
function checkPrecedence(it: PrecedenceItem): string[] {
  const p: string[] = [];
  if (it.files.length < 2) p.push('precedence needs at least 2 files');
  p.push(...duplicateScopes(it.files));
  if (!inRange(it.answer, it.opts.length)) p.push(`precedence.answer ${it.answer} out of range`);
  else
    it.opts.forEach((o, i) => {
      if (i !== it.answer && !o.feedback) p.push(`precedence option ${i} needs feedback`);
    });
  return p;
}

/** Would auto mode stop this: the answer is an outcome and every outcome has feedback. */
function checkAutoMode(it: AutoModeItem): string[] {
  const p: string[] = [];
  if (!AUTO_OUTCOMES.includes(it.answer)) p.push(`automode.answer "${String(it.answer)}" is not one of ${AUTO_OUTCOMES.join(', ')}`);
  for (const o of AUTO_OUTCOMES) if (!it.feedback?.[o]) p.push(`automode feedback.${o} is missing`);
  return p;
}

/** The modes demo follows the Shift+Tab cycle from auto (F4) and uses the product strings. */
const MODE_CYCLE = ['auto', 'default', 'acceptEdits', 'plan'] as const;
const MODE_STATUS: Record<(typeof MODE_CYCLE)[number], { status: string; desktop: string }> = {
  auto: { status: '⏵⏵ auto mode on', desktop: 'Auto' },
  default: { status: '⏸ manual mode on', desktop: 'Manual' },
  acceptEdits: { status: '⏵⏵ accept edits on', desktop: 'Accept edits' },
  plan: { status: '⏸ plan mode on', desktop: 'Plan' },
};

function checkModesDemo(demo: Extract<NonNullable<Card['demo']>, { kind: 'modes' }>): string[] {
  if (demo.modes.map((m) => m.mode).join() !== MODE_CYCLE.join()) return ['modes demo must follow the Shift+Tab cycle (F4)'];
  const p: string[] = [];
  for (const m of demo.modes) {
    const want = MODE_STATUS[m.mode];
    if (m.status !== want.status) p.push(`modes demo status for ${m.mode} must be "${want.status}"`);
    if (m.desktop !== want.desktop) p.push(`modes demo desktop label for ${m.mode} must be "${want.desktop}"`);
    if (m.runs.length === 0) p.push(`modes demo runs for ${m.mode} is empty`);
  }
  return p;
}

/** List keys merge across files (F11), so "which value wins" does not apply to them. */
const LIST_KEYS: readonly string[] = ['allow', 'ask', 'deny'];

function checkSettingsDemo(demo: Extract<NonNullable<Card['demo']>, { kind: 'settings' }>): string[] {
  const p: string[] = [];
  if (LIST_KEYS.includes(demo.key)) return [`settings demo key "${demo.key}" is a list key; lists merge (F11)`];
  p.push(...duplicateScopes(demo.files));
  if (!demo.files.some((f) => f.lines.some((l) => l.includes(`"${demo.key}":`)))) p.push(`settings demo: no file sets "${demo.key}"`);
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
    case 'poisoned':
      p.push(...checkHidden(it));
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
    case 'scopes':
    case 'package':
    case 'inside':
    case 'allowlist':
      p.push(...checkChoice(it));
      break;
    case 'rule':
      p.push(...checkRule(it));
      break;
    case 'settings':
    case 'review':
    case 'trim':
      p.push(...checkSettings(it));
      if (it.type === 'review') {
        if (!it.header) p.push('review needs a header (the plugin\'s "Will install" pane)');
        else if (it.header.rows.length === 0) p.push('review header needs rows');
      }
      break;
    case 'precedence':
      p.push(...checkPrecedence(it));
      break;
    case 'automode':
      p.push(...checkAutoMode(it));
      break;
  }
  return p;
}

export const DOCS_RANGE = [3, 8] as const;

/** Size rules for ready units (revision 2). */
export const CARD_RANGE = [4, 7] as const;
export const ITEM_RANGE = [10, 14] as const;
/** Most English words in a card's `body` plus `key` (`try` and `deep` are not counted). */
export const MAX_CARD_WORDS = 100;

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
const cardWords = (c: Card) => [...c.body, ...(c.key ? [c.key] : [])].reduce((n, l) => n + wordCount(l.en ?? ''), 0);

/** Returns every problem found; an empty array means the content is valid. */
export function validateContent(c: Content): string[] {
  const out: string[] = [];
  const typeKeys = new Set(c.practiceTypes.map((t) => t.key));
  const seenIds = new Map<string, string>();

  for (const pt of c.practiceTypes) checkText(`types/${pt.key}`, pt, [], out);
  for (const type of ITEM_TYPES) if (!typeKeys.has(type)) out.push(`types: no practice type for "${type}"`);

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
      const words = cardWords(card);
      if (words > MAX_CARD_WORDS) out.push(`${u.key}/${card.id}: card over ${MAX_CARD_WORDS} words, has ${words}`);
      if (card.more) checkRef(`${u.key}/${card.id}`, card.more, out);
      for (const msg of checkTry(card)) out.push(`${u.key}/${card.id}: ${msg}`);
      if (card.demo?.kind === 'modes') for (const msg of checkModesDemo(card.demo)) out.push(`${u.key}/${card.id}: ${msg}`);
      if (card.demo?.kind === 'settings') for (const msg of checkSettingsDemo(card.demo)) out.push(`${u.key}/${card.id}: ${msg}`);
      if (card.demo?.kind === 'rules') for (const msg of checkCalls(card.demo.calls)) out.push(`${u.key}/${card.id}: ${msg}`);
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
