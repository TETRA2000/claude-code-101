import type { Lang, Localized } from '../i18n/lang';
import type { Call, Outcome, Rule, RuleList } from '../rules/match';

type L = Localized;

export type Surface = 'terminal' | 'desktop';
export type ItemType =
  | 'approve'
  | 'decode'
  | 'predict'
  | 'pairs'
  | 'order'
  | 'hidden'
  | 'poisoned'
  | 'chain'
  | 'combo'
  | 'setup'
  | 'scopes'
  | 'package'
  | 'inside'
  | 'allowlist'
  | 'rule'
  | 'settings'
  | 'review'
  | 'trim'
  | 'precedence'
  | 'automode';
export const ITEM_TYPES: readonly ItemType[] = [
  'approve',
  'decode',
  'predict',
  'pairs',
  'order',
  'hidden',
  'poisoned',
  'chain',
  'combo',
  'setup',
  'scopes',
  'package',
  'inside',
  'allowlist',
  'rule',
  'settings',
  'review',
  'trim',
  'precedence',
  'automode',
];
/** Every answer an approve item can offer, in the order Claude Code lists them (F1). */
export const APPROVE_CHOICES = ['yes', 'always', 'auto', 'no'] as const;
export type ApproveChoice = (typeof APPROVE_CHOICES)[number];
export interface ApproveOutcome {
  feedback: L;
  headline?: L;
}

/** A link to the official docs: a slug (+ anchor) on code.claude.com, or a full URL with its language. */
export type DocRef = { slug: string; anchor?: string } | { url: string; lang: Lang };
export interface DocEntry {
  ref: DocRef;
  /** "Read this if…" */
  note: L;
}

interface Base {
  id: string;
  prompt: L;
  explain: L;
  more?: DocRef;
}
export interface ApproveItem extends Base {
  type: 'approve';
  surface: Surface;
  task: L;
  narration: L;
  tool: string;
  target: string;
  reason: L;
  /**
   * The options this prompt shows, in APPROVE_CHOICES order. Defaults to yes / always / no.
   * `auto` is offered exactly on terminal Bash prompts not forced by an ask rule (F1).
   */
  choices?: ApproveChoice[];
  /** The prompt was forced by an `ask` rule or a hook, so it never offers `auto` (F1). */
  askRule?: true;
  /** A desktop Browser pane site card: Allow once / Always allow / Deny (F8). */
  pane?: 'browser';
  /** Option 2's wording. Required when `always` is offered, except on a Browser pane card. */
  alwaysLabel?: L;
  accept: ApproveChoice[];
  /** One outcome per offered choice. */
  outcomes: Partial<Record<ApproveChoice, ApproveOutcome>>;
  decode?: { code: string; means: L }[];
}
export interface PredictItem extends Base {
  type: 'predict';
  situation?: L;
  code: string[];
  opts: { text: L; mono?: boolean; feedback?: L }[];
  answer: number;
}
export interface PairsItem extends Base {
  type: 'pairs';
  items: { id: string; left: L; right: L; leftMono?: boolean }[];
  order: string[];
}
export interface DecodeItem extends Base {
  type: 'decode';
  command: string;
  parts: { id: string; code: string; means: L }[];
  order: string[];
}
export interface OrderItem extends Base {
  type: 'order';
  steps: { id: string; text: L }[];
  start: string[];
}
/** Pick one or more right options. `setup` and the wave 2 types grade alike; `combo` also names ingredients. */
export const CHOICE_TYPES = ['setup', 'combo', 'scopes', 'package', 'inside', 'allowlist'] as const;
export interface ChoiceItem extends Base {
  type: (typeof CHOICE_TYPES)[number];
  surface?: Surface;
  scenario: L;
  /** A screen to read before choosing (an install or login screen, a package page, a sandbox config). Mono, untranslated. */
  panel?: { title: string; lines: string[] };
  ingredients?: { private: L; untrusted: L; exit: L }; // combo only
  opts: { text: L; feedback: L; removes?: 'private' | 'untrusted' | 'exit' }[];
  accept: number[];
}
/** `tools` is an MCP server's tool list (name + description per line); `poisoned` items require it. */
export type DocSource = 'notes' | 'web' | 'design' | 'readme' | 'issue' | 'email' | 'tools';
/** Find the hidden order; `poisoned` is the same task on a tool list. */
export interface HiddenItem extends Base {
  type: 'hidden' | 'poisoned';
  source: DocSource;
  title: L;
  location: string;
  lines: {
    /** The tool's name, untranslated. Required on every line of a `tools` source; `text` is its description. */
    tool?: string;
    text: L;
    style: 'h1' | 'h2' | 'p' | 'button' | 'small';
    hidden?: 'white' | 'comment' | 'alt' | 'tiny';
    raw?: { before: string; after: string };
  }[];
  answer: number[];
}
export interface BrowserScene {
  kind: 'browser';
  tabs: L[];
  url: string;
  profile: L;
  page: { title: L; body: L; hidden?: L };
}
export interface TerminalScene {
  kind: 'terminal';
  lines: string[];
}
export interface ChainItem extends Base {
  type: 'chain';
  task: L;
  scene: BrowserScene | TerminalScene;
  steps: { tool: string; target: string; why: L }[];
  answer: number;
  early: L;
  late: L;
}
/** Build the rule: pick a list and a pattern so every test call gets its wanted outcome (F12, F14). */
export interface RuleItem extends Base {
  type: 'rule';
  goal: L;
  /** Rules already in the settings; the learner's rule is added to these. */
  existing?: Rule[];
  lists: RuleList[];
  /** Full rule texts, e.g. `Bash(curl *)`. */
  patterns: string[];
  tests: { call: Call; want: Outcome }[];
}
/** The five settings scopes, named as the course shows them. */
export type Scope = 'managed' | 'cli' | 'local' | 'project' | 'user';
/** Highest precedence first (F11). */
export const SCOPE_ORDER: readonly Scope[] = ['managed', 'cli', 'local', 'project', 'user'];
/** Fix the settings: tap the line(s) that are wrong or dangerous. `review` and `trim` share this shape. */
export interface SettingsItem extends Base {
  type: 'settings' | 'review' | 'trim';
  file: string;
  scope?: Scope;
  /** `review` (required there): the plugin's details pane, e.g. its "Will install" rows, shown above the file. */
  header?: { title: string; rows: L[] };
  lines: string[];
  /** Feedback for a picked line, keyed by line index as a string. */
  notes?: Record<string, L>;
  answer: number[];
}
/** Which file wins? Several settings files set the same key. */
export interface PrecedenceItem extends Base {
  type: 'precedence';
  question: L;
  files: { scope: Scope; path: string; lines: string[] }[];
  opts: { text: L; mono?: boolean; feedback?: L }[];
  answer: number;
}
/** What auto mode does with an action (F4, F16). */
export const AUTO_OUTCOMES = ['runs', 'blocked', 'asks'] as const;
export type AutoOutcome = (typeof AUTO_OUTCOMES)[number];
/** Would auto mode stop this? The learner predicts: runs, blocked by the classifier, or still asks. */
export interface AutoModeItem extends Base {
  type: 'automode';
  surface: Surface;
  request: L;
  action: { tool: string; target: string };
  /** Context the classifier sees, shown as a list. */
  setup: L[];
  answer: AutoOutcome;
  feedback: Record<AutoOutcome, L>;
}
export type Item = ApproveItem | PredictItem | PairsItem | DecodeItem | OrderItem | ChoiceItem | HiddenItem | ChainItem | RuleItem | SettingsItem | PrecedenceItem | AutoModeItem;

export type Demo =
  | { kind: 'terminal'; cwd: string; commands: { cmd: string; output: { text: string; note?: L; secret?: boolean }[] }[] }
  | { kind: 'context'; chunks: { who: 'setup' | 'you' | 'claude' | 'outside'; label: L; author: L; text: L }[] }
  | {
      kind: 'anatomy';
      tool: string;
      target: string;
      reason: L;
      alwaysLabel: L;
      notes: { part: 'tool' | 'target' | 'reason' | 'options'; text: L }[];
    }
  | { kind: 'rules'; rules: Rule[]; calls: Call[] }
  | {
      kind: 'modes';
      modes: { mode: 'default' | 'acceptEdits' | 'plan' | 'auto'; status: string; desktop: string; runs: L[]; asks: L[] }[];
    }
  | { kind: 'settings'; key: string; files: { scope: Scope; path: string; who: L; lines: string[] }[] };
export interface TryStep {
  text: L;
  code?: string;
  /** Show a copy button. Only for safe snippets (the validator rejects UNSAFE_SNIPPET). */
  copy?: true;
}
export interface TryIt {
  terminal: TryStep[];
  desktop?: TryStep[];
  /** Shown on the Desktop tab when `desktop` is absent. */
  desktopNote?: L;
  check: L;
}
export interface Card {
  id: string;
  title: L;
  body: L[];
  key?: L;
  demo?: Demo;
  more?: DocRef;
  try?: TryIt;
  deep?: { title: L; body: L[] };
}

export type UnitStatus = 'ready' | 'soon';
export interface UnitMeta {
  key: string;
  status: UnitStatus;
  title: L;
  blurb: L;
  chips: string[];
  lastChecked?: string;
  docs?: DocEntry[];
  linksChecked?: string;
}
export interface UnitBody {
  cards: Card[];
  items: Item[];
}
export interface PracticeTypeInfo {
  key: string;
  name: L;
  blurb: L;
}
