/*
 * A small model of Claude Code's permission-rule matching in Manual mode, for teaching only.
 * It follows the documented behavior in docs/claude-code-facts.md (F12, F14) and nothing more:
 * - rules are `Tool` or `Tool(spec)`; `Tool` and `Tool(*)` match every use of the tool;
 * - in a spec, `*` matches any text (spaces too); a trailing ` *` also matches the bare command;
 *   a trailing `:*` means the same as ` *` (a colon anywhere else is literal);
 * - Bash commands are split on `&&` `||` `;` `|` `|&` `&` and newlines (quote-aware), and every
 *   part is checked on its own;
 * - deny, then ask, then allow; then the built-in read-only Bash commands (F14) and the read tools
 *   (`Read`, `Grep`, `Glob`, inside the working folder, F1) run; anything else asks;
 * - `WebFetch(domain:h)` matches the URL's host (case-insensitive, `*` allowed);
 * - other tools' specs match the call target with the same `*` rules (exact when there is no `*`).
 * Not modeled: wrapper stripping (`timeout`, `nice`, …), gitignore path semantics, a Read deny also
 * covering Edit/Write, read-only `git` forms, subshells and `$(…)`, the F14 exceptions that still
 * prompt, paths outside the working folder, other modes, MCP tools and tool-name globs.
 */

export type RuleList = 'allow' | 'ask' | 'deny';
export interface Rule {
  list: RuleList;
  /** e.g. `Bash(npm run *)`, `Read(./.env)`. */
  text: string;
}
export interface Call {
  tool: string;
  /** Bash: the full command text. WebFetch: the URL. File tools: the path. */
  target: string;
}
export type Outcome = 'runs' | 'asks' | 'blocked';

/** The built-in read-only Bash commands (F14), without the read-only forms of `git`. */
export const READ_ONLY: readonly string[] = ['ls', 'cat', 'echo', 'pwd', 'head', 'tail', 'grep', 'find', 'wc', 'which', 'diff', 'stat', 'du', 'cd'];

/** Tools whose reads inside the working folder run without a prompt (F1). */
const READ_TOOLS: readonly string[] = ['Read', 'Grep', 'Glob'];

/** Tool names this model understands. */
const TOOLS: readonly string[] = ['Bash', 'Read', 'Edit', 'Write', 'NotebookEdit', 'Glob', 'Grep', 'WebFetch', 'WebSearch'];

const balanced = (s: string): boolean => {
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')' && --depth < 0) return false;
  }
  return depth === 0;
};

/** Parses `Tool` or `Tool(spec)`. `null` means Claude Code would not understand the rule. `Tool(*)` gives spec null. */
export function parseRule(text: string): { tool: string; spec: string | null } | null {
  const m = /^([A-Za-z]+)(?:\(([\s\S]*)\))?$/.exec(text.trim());
  const tool = m?.[1];
  if (!m || !tool || !TOOLS.includes(tool)) return null;
  const spec = m[2];
  if (spec === undefined || spec === '*') return { tool, spec: null };
  if (spec.trim() === '' || !balanced(spec)) return null;
  if (tool === 'WebFetch' && !/^domain:\S+$/.test(spec)) return null;
  return { tool, spec };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whether `s` matches a rule spec: `*` is any text; a lone trailing ` *` (or `:*`) also matches the bare command. */
export function matchesPattern(pattern: string, s: string): boolean {
  const p = pattern.endsWith(':*') ? `${pattern.slice(0, -2)} *` : pattern;
  const stars = p.split('*').length - 1;
  if (stars === 1 && p.endsWith(' *') && s === p.slice(0, -2)) return true;
  return new RegExp(`^${p.split('*').map(escapeRe).join('[\\s\\S]*')}$`).test(s);
}

/** Splits a command on `&&` `||` `;` `|` `|&` `&` and newlines, outside quotes. Parts are trimmed; empty parts dropped. */
export function splitCompound(cmd: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]!;
    const next = cmd[i + 1];
    if (quote) {
      cur += ch;
      if (ch === '\\' && quote === '"' && next !== undefined) cur += cmd[++i];
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '\\' && next !== undefined) {
      cur += ch + next;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    const two = ch + (next ?? '');
    // `>&` and `&>` are redirects, not separators.
    const redirect = ch === '&' && (cmd[i - 1] === '>' || cmd[i - 1] === '<' || next === '>');
    if (two === '&&' || two === '||' || two === '|&') {
      parts.push(cur);
      cur = '';
      i++;
    } else if (ch === ';' || ch === '|' || ch === '\n' || (ch === '&' && !redirect)) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    const rest = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    return (rest.split(/[/?#\s]/)[0] ?? '').replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
  }
}

type Parsed = { list: RuleList; tool: string; spec: string | null };

function specMatches(r: Parsed, part: string): boolean {
  if (r.spec === null) return true;
  if (r.tool === 'WebFetch') return matchesPattern(r.spec.slice('domain:'.length).toLowerCase(), hostOf(part));
  return matchesPattern(r.spec, part);
}

function readOnly(tool: string, part: string): boolean {
  if (tool === 'Bash') return READ_ONLY.includes(part.split(/\s+/)[0] ?? '');
  return READ_TOOLS.includes(tool);
}

/** What happens to `call` in Manual mode with these rules: deny, then ask, then allow, then the built-in defaults. */
export function outcomeOf(rules: Rule[], call: Call): Outcome {
  const parsed: Parsed[] = rules.flatMap((r) => {
    const p = parseRule(r.text);
    return p && p.tool === call.tool ? [{ list: r.list, ...p }] : [];
  });
  const split = call.tool === 'Bash' ? splitCompound(call.target) : [call.target];
  const parts = split.length ? split : [call.target];
  const hit = (list: RuleList, part: string) => parsed.some((r) => r.list === list && specMatches(r, part));
  if (parts.some((p) => hit('deny', p))) return 'blocked';
  if (parts.some((p) => hit('ask', p))) return 'asks';
  return parts.every((p) => hit('allow', p) || readOnly(call.tool, p)) ? 'runs' : 'asks';
}
