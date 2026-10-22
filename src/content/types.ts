import type { Lang, Localized } from '../i18n/lang';

type L = Localized;

export type Surface = 'terminal' | 'desktop';
export type ItemType = 'approve' | 'decode' | 'predict' | 'pairs' | 'order' | 'hidden' | 'chain' | 'combo' | 'setup';
export const ITEM_TYPES: readonly ItemType[] = [
  'approve',
  'decode',
  'predict',
  'pairs',
  'order',
  'hidden',
  'chain',
  'combo',
  'setup',
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
export interface ChoiceItem extends Base {
  type: 'setup' | 'combo';
  surface?: Surface;
  scenario: L;
  ingredients?: { private: L; untrusted: L; exit: L }; // combo only
  opts: { text: L; feedback: L; removes?: 'private' | 'untrusted' | 'exit' }[];
  accept: number[];
}
export type DocSource = 'notes' | 'web' | 'design' | 'readme' | 'issue' | 'email';
export interface HiddenItem extends Base {
  type: 'hidden';
  source: DocSource;
  title: L;
  location: string;
  lines: {
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
export type Item = ApproveItem | PredictItem | PairsItem | DecodeItem | OrderItem | ChoiceItem | HiddenItem | ChainItem;

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
    };
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
