# Claude Code 101 Revision 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the built five-unit course into the 13-unit, doc-linked, deeper course of design revision 2, shipping wave 1 (units 1–5, 11, 12) first and wave 2 (units 6–10, 13) after.

**Architecture:** The engine stays. Changes are mostly new content JSON plus a few new pieces:
- a doc-link model with a language-aware URL builder;
- two new Learn card kinds ("Try it" and "Under the hood");
- a four-option approve prompt;
- a small permission-rule matcher behind one demo and one practice type;
- four new item types and three new demos.

Each task leaves `main`-quality green CI: typecheck, unit tests, build, and Playwright.

**Tech Stack:** Vite + React 18 + TypeScript, CSS Modules, Vitest + Testing Library (jsdom), Playwright, GitHub Actions. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-21-claude-code-101-design.md` (revision 2, approved). Read it before any task. Unit topic lists live in its "Unit outlines" section, and each content task points to its subsection. Also read `CLAUDE.md` (repo rules) and `docs/claude-code-facts.md` (facts sheet).

## Global Constraints

- Every learner-facing string is `Localized` (`{ en, ja }`), both non-empty. English is written first, and Japanese is a full, natural translation. Commands, paths, code, settings keys, URLs, tool names, and terminal output are plain untranslated strings.
- UI labels quoted from Claude Code (mode names, prompt options, status-bar text) stay in English inside Japanese content, with a Japanese gloss on first use.
- No real AI, no command execution, and no network requests except loading the site and Google Fonts. Doc links are plain `<a target="_blank" rel="noopener noreferrer">`.
- Content safety:
  - fake secrets contain `FAKE`;
  - simulation URLs use reserved hosts or `REAL_HOSTS`;
  - injection text is short, illustrative, and asks only for harmless actions on reserved hosts;
  - nothing teaches how to word things to get past auto mode's classifier.
- **Copy buttons exist only on safe snippets inside Try it cards** (`copy: true` steps). The validator rejects copy on dangerous-looking code. Nowhere else.
- Doc links: content stores `{ slug, anchor? }` for `code.claude.com/docs/<lang>/<slug>`, or `{ url, lang }` for allowed non-docs hosts. Allowed non-docs hosts: `support.claude.com`, `claude.com`, `www.anthropic.com`, `trust.anthropic.com`, and `github.com` (path under `/anthropics/` only).
- At most one `more` link per Learn card. Each ready unit has 3–8 `docs` entries, each with a "read this if…" note, plus `linksChecked` (`YYYY-MM-DD`).
- Ready units (final rule, Task 16): **4–7 Learn cards, 10–14 practice items, at most 100 English words per card** (body + key; `try` and `deep` excluded). Until Task 16 the validator accepts 3–7 cards and 8–14 items, with no word cap.
- Wave 1 units (ready after Task 15): `computer`, `agent`, `permissions`, `injection`, `browser`, `lockdown`, `automode`. Wave 2 units: `powers`, `mcp`, `extensions`, `installing`, `sandboxes`, `boss`.
- Course order (unit keys): `computer, agent, permissions, injection, browser, powers, mcp, extensions, installing, sandboxes, lockdown, automode, boss`.
- Approve answers:
  - choices are `yes | always | auto | no`;
  - `auto` is offered exactly when `surface === 'terminal' && tool === 'Bash' && !askRule` (facts F1);
  - in units `permissions`, `injection`, and `browser`, `auto` is never in `accept`;
  - a dangerous item (`accept` = `['no']`) has a headline on every other offered choice;
  - a harmless item has no headlines.
- Unit 3 practice stays roughly 60% harmless approve items (test: 50–70%).
- In `setup` items, Bypass permissions (or `--dangerously-skip-permissions`) is always a wrong option, except in units 10 and later, where it's right only for an isolated container or VM.
- Every Claude Code claim matches `docs/claude-code-facts.md`. Add a sourced entry (with `Checked:` date and version where the docs give one) before content uses a new fact. Commit bodies list the F-numbers used.
- Existing rules unchanged: `HEARTS_PER_RUN = 5`, `XP_FIRST_TRY = 10`, `XP_RETRY = 5`, `XP_HINT_COST = 5`, `ACTIVATION_GUARD_MS = 350`. Targets ≥44px, contrast ≥4.5:1, right/wrong never by color alone, `prefers-reduced-motion` respected, no horizontal scroll at 390px.
- Gates before every commit: `npm run typecheck`, `npm test`, `npm run build`. Tasks that touch screens or content also run `npm run test:e2e`.

## Review Focus

1. **A Japanese learner clicks a doc link for a page with no Japanese version.** They get the English page and the link says "English" before they click. Test in Task 3 (`docHref` fallback, `DocLink` label).
2. **Copy is blocked or unavailable** (no `navigator.clipboard`, permission denied, insecure context). The button shows a "couldn't copy" state and never throws. Test in Task 4.
3. **The drawn prompt and the answer buttons disagree** (e.g. the terminal shows "switch to auto mode" but no button offers it). Both come from one `choicesOf(item)` list, and the validator ties `auto` to F1's rule. Tests in Task 5.
4. **A returning learner's saved progress from the 11-unit build.** Keys are unit keys, so `lockdown`'s and `boss`'s flags carry over. `suggestedUnit` skips "soon" units across the wave-1 gap (5 → 11). Test in Task 2.
5. **A learner types a malformed rule into the rule tester** (`Bash(`, empty, `Bash(npm *) extra`, an unknown tool). The demo shows "this demo doesn't understand that rule" and doesn't crash. Tests in Task 6.

---

## File structure

```
content/course.json                 13 units: + extensions, + automode; `sources` → `docs`, + linksChecked
content/practice-types.json         + precedence, automode, review, trim
content/units/<key>.json            wave 1: computer agent permissions injection browser lockdown automode
                                    wave 2: powers mcp extensions installing sandboxes boss
docs/claude-code-facts.md           + F11–F26
src/content/types.ts                DocRef, docs/more/try/deep, approve choices, new item + demo types
src/content/docs.ts        (new)    DOC_SLUGS, JA_MISSING, LINK_HOSTS, docHref()
src/content/validate.ts             rules for all of the above
src/rules/match.ts         (new)    permission-rule matcher (rule tester + Build the rule)
src/components/DocLink.tsx (new)    one doc link (new-tab icon, sr text, "English" label)
src/screens/cards/TryIt.tsx (new)   Try it card body (tabs, steps, copy)
src/screens/cards/Deep.tsx  (new)   Under the hood <details>
src/screens/cards/DocsList.tsx (new) "Official docs" list (last Learn card, practice results)
src/screens/demos/ModesDemo.tsx, RulesDemo.tsx, SettingsDemo.tsx (new)
src/quiz/renderers/RuleBuilder.tsx, SettingsFile.tsx, Precedence.tsx, AutoMode.tsx (new)
src/quiz/grade.ts, feedback.ts, session.ts, types.ts, renderers/ItemBody.tsx, Approve.tsx, PermissionPrompt.tsx
src/quiz/Boss.tsx          (new, Task 23)  timed run + recap
src/i18n/ui.ts                      new UI strings (en + ja)
e2e/helpers.ts                      solve new item types; copy-button exception for Try it
CLAUDE.md                           rules updated in Tasks 4, 16
```

---

## Wave 1

### Task 1: Facts sheet for wave 1

**Files:**
- Modify: `docs/claude-code-facts.md`

**Interfaces:**
- Produces: sections `F11`–`F18`, each with bullets, `Source:` lines (official URLs), `Checked: YYYY-MM-DD`, versions where the docs give them, and `UNVERIFIED:` bullets for anything unsettled. Later tasks cite them.

- [ ] **Step 1: Research and write F11–F18 from the official docs only** (code.claude.com/docs and pages they link to; `claude --help` as fallback). The spec's unit outlines list the facts each needs.
  - `F11` Settings files, scopes, precedence (managed → `--settings` → local → project → user), list merging, `/status` "Setting sources", keys a project file can't set (`defaultMode` auto/bypass).
  - `F12` Permission rule syntax and matching: `Tool`/`Tool(specifier)`, the wildcard rules and the docs' wildcard table, `:*`, compound-command splitting and its separators, deny → ask → allow, "what a Bash rule doesn't match" table, the fragile URL-pattern warning, `Read(./.env)`, `WebFetch(domain:…)`.
  - `F13` Hooks: events used in the course (`PreToolUse`), exit code 2 blocks, a hook's deny holds in every mode including bypass, hooks run with full user permissions outside the sandbox, `/hooks`, the "block edits to protected files" example.
  - `F14` Read-only commands list, protected paths/files, critical paths, the working-folder prompt-not-wall note.
  - `F15` Workspace trust, plus the "What runs before you trust a folder" table rows the course uses.
  - `F16` Auto mode beyond F4:
    - boundaries stated in chat (and compaction losing them);
    - approvals must name the action and its risky detail;
    - the Recently denied tab and `r` to retry;
    - broad allow rules dropped on entry;
    - the first-read-outside-working-folders prompt and its four options;
    - subagent checks at three points;
    - per-command allowed domains with the sandbox;
    - "does not guarantee safety".
  - `F17` Sessions saved under `~/.claude/projects/` as plain JSONL, `~/.claude.json`, project `.claude/`, checkpoints (`Esc` twice, file edits only, remote actions not undoable), compaction, `/context`, `/memory`, `/init`, auto memory location and 200 lines/25KB.
  - `F18` Injection safeguards from the Security page: the web-fetch summary model, `curl`/`wget` never auto-approved, trust prompts, command-injection detection, subagent report scanning, "no system is completely immune", `/feedback`.
  - Extend `F8` (browser) with the Browser pane quotes (clean profile; classifiers on clicks and typing in every mode; Allow once / Always allow / Deny; no purchases, accounts, or CAPTCHAs without input), Chrome upload refusal of `.env`/`.pem`/`.key`/`.ssh` (v2.1.293+), and GIFs capturing account details. Add the computer use tiers (desktop: off by default; per-app approval for the session; view-only for browsers and trading platforms, click-only for terminals and IDEs, full control for everything else).

- [ ] **Step 2: Verify**

Run: `grep -c '^## F' docs/claude-code-facts.md` → `18`; `grep -c '^Checked: ' docs/claude-code-facts.md` → `≥ 18`.

- [ ] **Step 3: Commit** `docs: add facts F11–F18 for revision 2 wave 1`

---

### Task 2: 13-unit course map

**Files:**
- Modify: `content/course.json`, `content/practice-types.json`, `src/content/validate.ts`, `src/content/content.test.ts`, `src/state/app.test.ts`

**Interfaces:**
- Produces: course order and unit keys from Global Constraints. New soon units: `extensions` ("Skills, plugins and subagents", chips `review`, `settings`, `approve`) and `automode` ("Auto mode, safely", chips `automode`, `setup`, `approve`). Practice types gain `precedence` ("Which file wins?"), `automode` ("Would auto mode stop this?"), `review` ("Review before install"), `trim` ("Trim the list"). Retitle `allowlist` to "Will it get out?". `lockdown` chips become `rule`, `precedence`, `settings`, `setup`.
- Produces: validator range constants `CARD_RANGE = [3, 7]` and `ITEM_RANGE = [8, 14]` (exported, transitional).

- [ ] **Step 1: Write failing tests**
  - `content.test.ts › lists all 13 units in course order`: `expect(content.units.map(u => u.key)).toEqual([...13 keys...])`.
  - `content.test.ts › wave 2 and new units are soon`: `extensions`, `automode`, `powers`, `mcp`, `installing`, `sandboxes`, `lockdown`, `boss` have `status: 'soon'`.
  - `app.test.ts › suggestedUnit skips soon units across a gap`: with units 1–5 practiced, a content where `lockdown` is ready makes `suggestedUnit` return `lockdown`.
  - `app.test.ts › old progress keys still apply`: a `Progress` with `practiced: { computer: true, lockdown: true }` marks `computer` done, and `lockdown` stays done once ready.
- [ ] **Step 2: Run** `npx vitest run src/content src/state` → the order test FAILs.
- [ ] **Step 3: Edit `course.json` and `practice-types.json`; set `CARD_RANGE`/`ITEM_RANGE` in `validate.ts`** with messages `needs 3–7 cards` / `needs 8–14 items`. Write titles, blurbs, and chips for the two new units from the spec's map table, in both languages.
- [ ] **Step 4: Run** `npm test` → PASS. `npm run test:e2e` → PASS (the layout spec counts articles from `course.json`).
- [ ] **Step 5: Commit** `feat: 13-unit course map with skills/plugins and auto mode units`

---

### Task 3: Links to the official docs

**Files:**
- Create: `src/content/docs.ts`, `src/content/docs.test.ts`, `src/components/DocLink.tsx` (+ `.module.css`, `.test.tsx`), `src/screens/cards/DocsList.tsx` (+ css)
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/test/fixtures.ts`, `src/screens/Learn.tsx` (+ test), `src/quiz/QuizEnd.tsx`, `src/quiz/Quiz.tsx`, `src/quiz/FeedbackSheet.tsx`, `src/quiz/feedback.ts`, `src/i18n/ui.ts`, `content/course.json`

**Interfaces:**
- Produces in `types.ts`:
  ```ts
  export type DocRef = { slug: string; anchor?: string } | { url: string; lang: Lang };
  export interface DocEntry { ref: DocRef; note: L }   // note = "read this if…"
  // UnitMeta: remove `sources`; add `docs?: DocEntry[]; linksChecked?: string`
  // Card: add `more?: DocRef`      Base (all items): add `more?: DocRef`
  ```
- Produces in `docs.ts`:
  ```ts
  export const DOC_SLUGS: readonly string[];   // every slug listed in the spec + 'overview', 'tools-reference', 'interactive-mode', 'desktop-quickstart', 'checkpointing', 'sessions'
  export const JA_MISSING: readonly string[];  // [] today (all spec slugs had ja pages on 2026-10-21)
  export const LINK_HOSTS: readonly string[];  // the five non-docs hosts
  export function docHref(ref: DocRef, lang: Lang, missing: readonly string[] = JA_MISSING): { href: string; lang: Lang };
  ```
- Produces: `<DocLink docRef label? />` and `<DocsList docs={DocEntry[]} />`. UI strings `learnMore`, `officialDocs`, `opensNewTab`, `englishPage`.

- [ ] **Step 1: Write failing tests**
  - `docs.test.ts`:
    - `docHref({slug:'permissions', anchor:'manage-permissions'}, 'ja')` → `{ href: 'https://code.claude.com/docs/ja/permissions#manage-permissions', lang: 'ja' }`.
    - A slug in the `missing` list with lang `ja` → the `/en/` href with `lang: 'en'` (the test passes `['permissions']` as `missing`).
    - `{url, lang:'en'}` returns the url unchanged.
  - `DocLink.test.tsx`: renders `target="_blank"` and `rel="noopener noreferrer"`, sr-only text `ui.opensNewTab`, and the visible `ui.englishPage` label when the resolved lang differs from the UI lang.
  - `validate.test.ts`:
    - unknown slug → `unknown doc slug "x"`;
    - url host not in `LINK_HOSTS` → `link host "evil.example" not allowed`;
    - `github.com/other/...` → rejected;
    - a ready unit with 2 or 9 `docs` → `needs 3–8 docs`;
    - a ready unit without `linksChecked` matching `YYYY-MM-DD` → rejected.
    - Update the fixture: `sources` → `docs` (3 entries) and `linksChecked`.
  - `Learn.test.tsx`: a card with `more` shows a link named `ui.learnMore`, and the last card shows the `ui.officialDocs` list with the unit's entries.
- [ ] **Step 2: Run** `npx vitest run src/content src/components src/screens` → FAIL.
- [ ] **Step 3: Implement.**
  - `docHref` per the signature.
  - Validator rules replace the `sources` rule. Links are not subject to the reserved-host rule for simulations, so exclude `docs`/`more` from `checkText`'s host scan and check them with the new rules.
  - `DocLink` and `DocsList`.
  - Learn shows `more` under the card text and `DocsList` on the last card.
  - `QuizDone` shows `DocsList` for the unit (Quiz passes `content.unitByKey(unitKey)?.docs`).
  - FeedbackSheet shows the item's `more` link after `explain`, via `FeedbackText.more?: DocRef`.
- [ ] **Step 4: Fill `docs` and `linksChecked` for the five ready units** in `course.json`, using the "Docs:" lists in the spec's outlines for units 1–5. Notes in both languages. Delete each unit's `sources`.
- [ ] **Step 5: Run** the gates and `npm run test:e2e` → PASS.
- [ ] **Step 6: Commit** `feat: language-aware links to the official docs`

---

### Task 4: Try it and Under the hood cards

**Files:**
- Create: `src/screens/cards/TryIt.tsx` (+ css, test), `src/screens/cards/Deep.tsx` (+ css)
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/test/fixtures.ts`, `src/screens/Learn.tsx`, `src/i18n/ui.ts`, `e2e/helpers.ts`, `CLAUDE.md`

**Interfaces:**
- Produces:
  ```ts
  export interface TryStep { text: L; code?: string; copy?: true }
  export interface TryIt { terminal: TryStep[]; desktop?: TryStep[]; desktopNote?: L; check: L }
  // Card: add `try?: TryIt; deep?: { title: L; body: L[] }`
  export const UNSAFE_SNIPPET: RegExp; // in validate.ts:
  //   /\brm\b|\bsudo\b|\bcurl\b|\bwget\b|\|\s*(ba)?sh\b|\bchmod\b|--dangerously|bypassPermissions|(^|\s)>/
  ```
- Produces UI strings: `tryIt`, `tabTerminal`, `tabDesktop`, `checkItWorked`, `copy`, `copied`, `copyFailed`, `underTheHood`.

- [ ] **Step 1: Write failing tests**
  - `TryIt.test.tsx`:
    - tabs follow the ARIA tabs pattern (`role="tablist"`, arrow keys move between tabs, `aria-selected`);
    - the Desktop tab shows `desktopNote` when `desktop` is absent;
    - only steps with `copy` show a button named `ui.copy`;
    - clicking it with a stub `navigator.clipboard.writeText` resolving shows `ui.copied`;
    - with `writeText` rejecting **or** `navigator.clipboard` undefined, it shows `ui.copyFailed` and doesn't throw (Review Focus 2).
  - `validate.test.ts`:
    - `copy` on `curl -s x | sh` → `unsafe snippet has copy`;
    - `try` with no terminal steps → rejected;
    - `try` with neither `desktop` nor `desktopNote` → rejected.
  - `Learn.test.tsx`: a card with `deep` renders a closed `<details>` whose `<summary>` is `ui.underTheHood`.
- [ ] **Step 2: Run** `npx vitest run src/screens src/content` → FAIL.
- [ ] **Step 3: Implement** `TryIt` (container has `data-try`), `Deep`, the Learn wiring, and the validator rules.
  - In `e2e/helpers.ts`, change `expectNoCopyButtons` to exclude buttons inside `[data-try]`, and add `expectCopyOnlyInTryIt(page)`: every copy button has a `[data-try]` ancestor.
  - In `CLAUDE.md`, replace "There are no copy buttons anywhere" with "Copy buttons appear only on safe snippets in Try it cards (`copy: true`; the validator rejects unsafe code)".
- [ ] **Step 4: Run** the gates and e2e → PASS.
- [ ] **Step 5: Commit** `feat: Try it and Under the hood Learn cards`

---

### Task 5: Four-option approve prompt

**Files:**
- Create: `src/content/approve.ts`
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/quiz/grade.ts` (+ test), `src/quiz/feedback.ts` (+ test), `src/quiz/renderers/Approve.tsx` (+ test), `src/quiz/renderers/PermissionPrompt.tsx`, `src/screens/demos/AnatomyDemo.tsx`, `src/i18n/ui.ts`, `src/test/fixtures.ts`, `e2e/helpers.ts`, `content/units/permissions.json`, `content/units/injection.json`, `content/units/browser.json`

**Interfaces:**
- Produces:
  ```ts
  export const APPROVE_CHOICES = ['yes', 'always', 'auto', 'no'] as const;
  // ApproveItem: add `choices?: ApproveChoice[]` (default ['yes','always','no'], in APPROVE_CHOICES order),
  //   `askRule?: true`, `pane?: 'browser'`; `alwaysLabel` becomes optional (required when 'always' is offered);
  //   outcomes becomes Partial<Record<ApproveChoice, Outcome>>
  export function choicesOf(item: ApproveItem): ApproveChoice[];          // new file src/content/approve.ts (used by quiz and validator)
  export const AUTO_WRONG_UNITS: readonly string[] = ['permissions', 'injection', 'browser']; // validate.ts
  ```
  - `AnswerState.sel` for approve now indexes `choicesOf(item)`.
  - UI strings:
    - `approveAuto`: en `Yes, and switch to auto mode`; ja is the same English label followed by a short gloss, `Yes, and switch to auto mode（auto モードに切り替えて許可）`.
    - `paneAllowOnce`, `paneAlwaysAllow`, `paneDeny`.

- [ ] **Step 1: Write failing tests**
  - `grade.test.ts`: for an item with `choices: ['yes','always','auto','no']` and `accept: ['no']`, `sel: 3` is correct and `sel: 2` is wrong.
  - `feedback.test.ts`: `sel: 2` on that item returns `outcomes.auto.feedback` and its headline.
  - `validate.test.ts`:
    - outcomes keys ≠ choices → `outcomes must match choices`;
    - `always` offered with no `alwaysLabel` → rejected;
    - a terminal Bash item without `auto` → `terminal Bash prompts offer auto (F1)`;
    - `auto` on a desktop or non-Bash item → rejected;
    - `auto` with `askRule` → rejected;
    - `pane: 'browser'` on a terminal item → rejected;
    - a dangerous item missing a headline on `auto` → rejected;
    - `auto` in `accept` in a unit listed in `AUTO_WRONG_UNITS` → `auto is never right while learning`.
  - `Approve.test.tsx`: the answer buttons equal the prompt's option lines in count and order. For `pane: 'browser'` the labels are `paneAllowOnce`/`paneAlwaysAllow`/`paneDeny` (Review Focus 3).
- [ ] **Step 2: Run** `npx vitest run src/quiz src/content` → FAIL.
- [ ] **Step 3: Implement.**
  - `choicesOf`, then grade, feedback, and validator.
  - `PermissionPrompt` takes `options: string[]` from the caller instead of deciding by tool. Keep the F1 Bash layout (title, question line, footer). Desktop `pane: 'browser'` draws the F8 card ("Allow once / Always allow / Deny").
  - `AnatomyDemo` passes the four Bash options.
  - In `e2e/helpers.ts`, `selectAnswer` builds labels from `choicesOf(item)`.
- [ ] **Step 4: Update content.**
  - Every terminal Bash approve item in `permissions` and `injection` gets `choices` with `auto` and an `outcomes.auto`:
    - dangerous items get a headline, plus feedback naming what switching would also change;
    - harmless items get gentle feedback: the command was fine, but stay in Manual while learning.
  - `browser`'s Browser-pane item gets `pane: 'browser'`.
- [ ] **Step 5: Run** the gates and e2e → PASS.
- [ ] **Step 6: Commit** `feat: approve items offer the real four-option Bash prompt` (body: F1, F8)

---

### Task 6: Permission-rule matcher, rule tester demo, Build the rule

**Files:**
- Create: `src/rules/match.ts` (+ `match.test.ts`), `src/screens/demos/RulesDemo.tsx` (+ css), `src/quiz/renderers/RuleBuilder.tsx` (+ css, test)
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/quiz/types.ts`, `src/quiz/session.ts` (+ test), `src/quiz/grade.ts`, `src/quiz/feedback.ts`, `src/quiz/renderers/ItemBody.tsx`, `src/screens/Learn.tsx`, `src/i18n/ui.ts`, `src/test/fixtures.ts`, `e2e/helpers.ts`

**Interfaces:**
- Produces in `src/rules/match.ts` (a model of the documented behavior, facts F12/F14; no wrappers, no parameter rules, no tool-name globs):
  ```ts
  export type RuleList = 'allow' | 'ask' | 'deny';
  export interface Rule { list: RuleList; text: string }        // e.g. 'Bash(npm run *)', 'Read(./.env)'
  export interface Call { tool: string; target: string }         // Bash target = full command text
  export type Outcome = 'runs' | 'asks' | 'blocked';
  export function parseRule(text: string): { tool: string; spec: string | null } | null; // null = not understood
  export function matchesPattern(pattern: string, s: string): boolean;
  export function splitCompound(cmd: string): string[];         // on && || ; | |& & and newlines
  export function outcomeOf(rules: Rule[], call: Call): Outcome; // Manual mode
  export const READ_ONLY: readonly string[];                     // F14 list
  ```
  `outcomeOf` works as follows:
  - Bash commands are split into parts.
  - If any part matches a deny rule, the result is `blocked`.
  - Otherwise, if any part matches an ask rule, it's `asks`.
  - Otherwise, if every part is allowed or read-only, it's `runs`.
  - Otherwise it's `asks`.
  - Non-Bash calls are matched as one part. `WebFetch(domain:h)` matches when `target`'s host is `h`.
- Produces:
  ```ts
  export interface RuleItem extends Base {
    type: 'rule'; goal: L; existing?: Rule[]; lists: RuleList[]; patterns: string[];
    tests: { call: Call; want: Outcome }[];
  }
  // Demo: | { kind: 'rules'; rules: Rule[]; calls: Call[] }
  // AnswerState: add `list: number | null` (index into item.lists; `freshAnswer` sets null); `sel` = pattern index
  // SessionAction: add { type: 'selectList'; list: number }
  // FeedbackText: add `checks?: { label: string; ok: boolean }[]` (one per test)
  ```

- [ ] **Step 1: Write failing tests**
  - `match.test.ts › wildcard table`: every row of the docs' wildcard table in F12 as a `matchesPattern` case. For example, `npm run *` matches `npm run` but not `npm install`; `ls *` doesn't match `lsof`; `ls*` does; `* --help *` doesn't match `npm --help`; `ls:*` ≡ `ls *`.
  - `match.test.ts › compound`: `outcomeOf([{list:'allow',text:'Bash(safe-cmd *)'}], {tool:'Bash',target:'safe-cmd && other-cmd'})` → `asks`, and a deny on `rm *` blocks `cd x && rm -rf y`.
  - `match.test.ts › limits`: deny `Bash(curl *)` blocks `curl https://example.com` but returns `asks` for `/usr/bin/curl https://example.com` and `sh -c 'curl https://example.com'` (F12 table).
  - `match.test.ts › order`: deny beats a narrower allow (`Bash(aws *)` deny vs `Bash(aws s3 ls)` allow → `blocked`), and ask beats allow.
  - `match.test.ts › read-only`: `ls -la` → `runs` with no rules, and `npm test` → `asks`.
  - `match.test.ts › malformed` (Review Focus 5): `parseRule` returns `null` for `''`, `'Bash('`, `'Bash(npm *) extra'`, and `'(x)'`.
  - `RulesDemo` test: typing `Bash(` shows `ui.ruleNotUnderstood`, and adding `deny Read(./.env)` turns the `.env` call to `blocked`.
  - `validate.test.ts`: a `rule` item where no (list, pattern) pair satisfies all tests → `rule item has no solution`; one where every pair does → `rule item has no wrong answer`.
  - `session.test.ts`: `selectList` + `select` + `check` grades through `outcomeOf`.
- [ ] **Step 2: Run** `npx vitest run src/rules src/quiz src/content src/screens` → FAIL.
- [ ] **Step 3: Implement** the matcher, then RulesDemo (list `<select>`, text input, per-call outcome with icon + text), then RuleBuilder (list buttons, pattern buttons in mono, test table revealed in feedback via `checks`).
  - Add `rule` to `ItemBody`.
  - `canCheck` needs both `list` and `sel`.
  - `e2e/helpers.ts`: solve by brute force over (list, pattern) with `outcomeOf`.
- [ ] **Step 4: Run** the gates → PASS.
- [ ] **Step 5: Commit** `feat: permission-rule matcher, rule tester demo, Build the rule`

---

### Task 7: Fix the settings, Which file wins?, settings stack demo

**Files:**
- Create: `src/quiz/renderers/SettingsFile.tsx`, `src/quiz/renderers/Precedence.tsx`, `src/screens/demos/SettingsDemo.tsx` (each + css; tests for the two renderers and the demo)
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/quiz/grade.ts` (+ test), `src/quiz/session.ts`, `src/quiz/feedback.ts`, `src/quiz/renderers/ItemBody.tsx`, `src/screens/Learn.tsx`, `src/i18n/ui.ts`, `src/test/fixtures.ts`, `e2e/helpers.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Scope = 'managed' | 'cli' | 'local' | 'project' | 'user';
  export const SCOPE_ORDER: readonly Scope[] = ['managed', 'cli', 'local', 'project', 'user']; // highest first (F11)
  export interface SettingsItem extends Base {
    type: 'settings' | 'review' | 'trim'; file: string; scope?: Scope;
    header?: { title: string; rows: L[] };   // wave 2 'review': plugin details pane
    lines: string[]; notes?: Record<string, L>; answer: number[];
  }
  export interface PrecedenceItem extends Base {
    type: 'precedence'; question: L;
    files: { scope: Scope; path: string; lines: string[] }[];
    opts: { text: L; mono?: boolean; feedback?: L }[]; answer: number;
  }
  // Demo: | { kind: 'settings'; key: string; files: { scope: Scope; path: string; who: L; lines: string[] }[] }
  ```
  - `settings`/`review`/`trim` grade like `hidden` (set equality of `picked`), and `togglePick` accepts them.
  - `precedence` grades like `predict`.
  - SettingsDemo: click a file → shows `who`. A "which value wins" line shows the value of `key` from the highest `SCOPE_ORDER` file that sets it (a plain substring search for `"<key>":` in its lines).
  - `key` must be a single-value key such as `defaultMode`. List keys like `permissions.allow` merge across files instead (F11), and the demo's content says so in a `who` note. The validator rejects a settings demo whose `key` is `allow`, `ask`, or `deny`.

- [ ] **Step 1: Write failing tests**
  - `grade.test.ts`: settings set equality; precedence index.
  - `validate.test.ts`: settings `answer` out of range → rejected; precedence `answer` out of range → rejected; a wrong precedence option without feedback → rejected; duplicate scopes in `files` → rejected.
  - `SettingsFile.test.tsx`: lines render as `aria-pressed` buttons in a mono panel titled with `file`. After Check, a picked line with `notes[i]` shows that note.
  - `SettingsDemo.test.tsx`: with `user` and `project` files both setting `"defaultMode"`, the wins line names the project value. Clicking the `local` file shows its `who` text.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the renderers and demo, `ItemBody` cases, and e2e solvers.
- [ ] **Step 4: Run** the gates → PASS.
- [ ] **Step 5: Commit** `feat: Fix the settings, Which file wins?, settings stack demo`

---

### Task 8: Would auto mode stop this?, mode switcher demo

**Files:**
- Create: `src/quiz/renderers/AutoMode.tsx`, `src/screens/demos/ModesDemo.tsx` (each + css, test)
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/quiz/grade.ts`, `src/quiz/feedback.ts`, `src/quiz/renderers/ItemBody.tsx`, `src/screens/Learn.tsx`, `src/i18n/ui.ts`, `src/test/fixtures.ts`, `e2e/helpers.ts`

**Interfaces:**
- Produces:
  ```ts
  export const AUTO_OUTCOMES = ['runs', 'blocked', 'asks'] as const;
  export type AutoOutcome = (typeof AUTO_OUTCOMES)[number];
  export interface AutoModeItem extends Base {
    type: 'automode'; surface: Surface; request: L;
    action: { tool: string; target: string }; setup: L[];
    answer: AutoOutcome; feedback: Record<AutoOutcome, L>;
  }
  // Demo: | { kind: 'modes'; modes: { mode: 'default' | 'acceptEdits' | 'plan' | 'auto';
  //          status: string; desktop: string; runs: L[]; asks: L[] }[] }
  ```
  - `sel` indexes `AUTO_OUTCOMES`.
  - ModesDemo has two views: a terminal status bar with a "Press Shift+Tab" button that cycles in F4's order from `auto`, and a desktop selector of radio buttons. Both show the selected mode's `runs`/`asks` lists.
  - UI strings: `autoRuns`, `autoBlocked`, `autoAsks`, `pressShiftTab`, `modeSelector`.

- [ ] **Step 1: Write failing tests**
  - `grade.test.ts`: automode answer.
  - `validate.test.ts`: an automode item missing feedback for any outcome → rejected; a modes demo whose `modes` isn't exactly `auto, default, acceptEdits, plan` in that order → `modes demo must follow the Shift+Tab cycle (F4)`.
  - `ModesDemo.test.tsx`: starts on `auto` (status `⏵⏵ auto mode on`). One press of the Shift+Tab button → `⏸ manual mode on`. Four presses return to auto.
  - `AutoMode.test.tsx`: three options labeled `autoRuns`/`autoBlocked`/`autoAsks`, with the setup list rendered.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**, `ItemBody` case, and e2e solver.
- [ ] **Step 4: Run** the gates → PASS.
- [ ] **Step 5: Commit** `feat: Would auto mode stop this? and mode switcher demo`

---

### Content tasks (9–15, 18–23): shared rules

Each content task does all of the following:
- rewrites or creates `content/units/<key>.json` from the spec's outline for that unit, covering every bullet in it;
- sets the unit `ready` in `course.json` with `lastChecked`, `linksChecked`, and `docs` (from the outline's "Docs:" line);
- gives each card at most one `more` link;
- adds the facts it needs to the facts sheet first;
- extends that unit's `describe` block in `src/content/content.test.ts` with the listed assertions.

Card text targets 80 English words, hard cap 100 (body + key). Anything longer becomes two cards, a demo, or a `deep` section. Then run the gates and `npm run test:e2e` (the layout spec walks every ready unit in both languages), and commit with the F-numbers in the body.

### Task 9: Unit 1 `computer`, deepened

- **Outline:** spec § Unit outlines → 1. New material: where Claude Code keeps its files.
- **Cards:** 5–6, at least one with the `terminal` demo showing `~/.claude/projects/` with a transcript file. Items: 10–12.
- **Test:** ready; card count 4–7; items 10–14; a `pairs` item includes the `~/.claude/projects` left label; types ⊆ {predict, decode, pairs}.
- **Commit:** `content: deepen unit 1 computer` (F17)

### Task 10: Unit 2 `agent`, deepened

- **Outline:** spec § Unit outlines → 2.
- **Cards:** 6–7, including the `context` demo, one `try` card (`/context` and `/memory`; desktop via `desktopNote` if the docs don't cover it), and one `deep` card on the harness.
- **Items:** 11–13, including an `order` item for gather → act → verify, and a `predict` item on "can this be undone?" whose answer is "no" for a sent message.
- **Test:** ready; has `context` demo, a `try` card, an `order` item, and ≥2 predict items.
- **Commit:** `content: deepen unit 2 agent` (F6, F7, F17)

### Task 11: Unit 3 `permissions`, deepened

- **Outline:** spec § Unit outlines → 3.
- **Cards:** 6–7, including the `anatomy` demo (four Bash options), the `modes` demo, a `try` card "Switch to Manual" (terminal: `Shift+Tab` and `"defaultMode": "manual"` with `copy`; desktop: mode selector), and a `try` card "See and remove saved rules" (`/permissions`).
- **Items:** 12–14.
  - Approve items are about 60% harmless (test 50–70%), with ≥3 desktop and ≥3 terminal.
  - At least one approve item has a prompt that offers only a one-time Yes (`choices: ['yes','no']`).
  - At least one item targets a protected file (`.zshrc` or `.mcp.json`).
  - Plus decode and setup items.
- **Test:** the existing unit 3 assertions; a `modes` demo; two `try` cards; a `['yes','no']` approve item.
- **Commit:** `content: deepen unit 3 permissions` (F1–F5, F14, F15)

### Task 12: Unit 4 `injection`, deepened

- **Outline:** spec § Unit outlines → 4.
- **Cards:** 5–7, including the `context` demo, a card on what each tool passes to Claude (F18 web-fetch summary vs browser/MCP raw), and a `try` card "Read what's saved" (`/memory`).
- **Items:** 11–14. Hidden items cover ≥5 sources and ≥3 methods. Terminal chains ≥2, one ending in a CLAUDE.md write. Approve items ≥2. One hidden item is an MCP tool result (`source: 'web'` is fine until wave 2 adds `tools`).
- **Test:** the existing unit 4 assertions, plus a `try` card.
- **Commit:** `content: deepen unit 4 injection` (F6, F18)

### Task 13: Unit 5 `browser`, deepened

- **Outline:** spec § Unit outlines → 5, including the upload-trap note: use files the Chrome guard doesn't name.
- **Cards:** 6–7, with Chrome extension vs Browser pane on separate cards and one computer-use card.
- **Items:** 12–14. They cover the eight scenarios of the existing `SCENARIOS` test (update the ids). At least one `pane: 'browser'` approve item, and at least one `setup` item choosing between the Chrome extension and the Browser pane.
- **Test:** the existing unit 5 assertions with updated ids. No approve or chain target in this unit names `.env`, `id_rsa`, `.pem`, or `.key` as an *upload* (`browser_file_upload`) target.
- **Commit:** `content: deepen unit 5 browser` (F8)

### Task 14: Unit 11 `lockdown`

- **Outline:** spec § Unit outlines → 11 (needs F11–F13).
- **Cards:** 6–7, with the `settings` demo, the `rules` demo, a `try` card "Protect your secrets" (deny rules JSON with `copy`), a hooks card (reading exercise on the F13 example, no copy), and a starter safe setup card.
- **Items:** 12–14, with ≥3 `rule`, ≥2 `precedence`, ≥2 `settings`, ≥1 `setup`, and ≥2 `approve` (one with `askRule: true`). `auto` may be accepted here.
- **Test:** ready; those counts; at least one `rule` test call uses `/usr/bin/curl` or `sh -c`, so the "deny isn't a wall" lesson is practiced.
- **Commit:** `content: add unit 11 lockdown` (F11–F14)

### Task 15: Unit 12 `automode`

- **Outline:** spec § Unit outlines → 12 (needs F4, F16), including the short sandbox explainer card linking ahead (`more: { slug: 'sandboxing' }`).
- **Cards:** 6–7, including the `modes` demo.
- **Items:** 12–14, with ≥6 `automode`, ≥2 `setup`, and ≥2 `approve`, at least one of which accepts `auto`. The automode items together cover:
  - a default block;
  - "reading `.env` and sending it to its matching API" (`runs`);
  - an `ask` rule forcing a prompt (`asks`);
  - a protected-path write;
  - a boundary stated in chat;
  - a boundary lost after compaction.
- **Test:** ready; those counts. Two content tests: ≥1 automode item's `setup` mentions `compaction`/`summar`, and ≥1 automode item's `action.target` contains `.env` with `answer: 'runs'`.
- **Commit:** `content: add unit 12 auto mode, safely` (F4, F16)

### Task 16: Close wave 1

**Files:**
- Modify: `src/content/validate.ts` (+ test), `CLAUDE.md`

- [ ] **Step 1: Write failing tests** (`validate.test.ts`)
  - A ready unit with 3 cards → `needs 4–7 cards`.
  - A ready unit with 9 items → `needs 10–14 items`.
  - A card whose English body + key has 101 words → `card over 100 words`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Set `CARD_RANGE = [4, 7]`, `ITEM_RANGE = [10, 14]`, and add `MAX_CARD_WORDS = 100`** (count whitespace-separated tokens in `en` of `body` and `key`).
- [ ] **Step 4: Update `CLAUDE.md`.**
  - Ready-unit sizes (4–7 / 10–14 / 100 words).
  - `sources` → `docs`/`linksChecked`.
  - The approve `auto` rule.
  - The new item types in the file map, with the new files.
  - "Unit 3 recommends Manual; unit 12 teaches auto mode".
- [ ] **Step 5: Run** all gates and the full e2e → PASS. Fix any content the new caps catch in this task.
- [ ] **Step 6: Commit** `chore: enforce revision 2 unit sizes; update repo rules`. Wave 1 is shippable here.

---

## Wave 2

### Task 17: Wave 2 item shapes

**Files:**
- Modify: `src/content/types.ts`, `src/content/validate.ts` (+ test), `src/quiz/renderers/Choice.tsx` (+ test), `src/quiz/renderers/HiddenDoc.tsx` (+ test), `src/quiz/renderers/SettingsFile.tsx`, `src/quiz/grade.ts`, `src/quiz/renderers/ItemBody.tsx`, `content/practice-types.json`, `src/test/fixtures.ts`, `e2e/helpers.ts`

**Interfaces:**
- Produces:
  ```ts
  // ChoiceItem.type: 'setup' | 'combo' | 'scopes' | 'package' | 'inside' | 'allowlist'
  // ChoiceItem: add `panel?: { title: string; lines: string[] }`   (mono, untranslated; rendered above opts)
  // HiddenItem.type: 'hidden' | 'poisoned';  DocSource adds 'tools' (an MCP tool list; required for 'poisoned')
  // SettingsItem 'review' renders `header` (Will install rows) above the file
  ```
  New choice types grade like `setup`.

- [ ] **Step 1: Write failing tests**
  - Choice renders `panel` lines in a mono frame titled `panel.title`.
  - HiddenDoc with `source: 'tools'` draws a tool list (name + description per line).
  - Validator: a `poisoned` item without `source: 'tools'` → rejected; a `review` item without `header` → rejected; every item type has a `practice-types.json` entry (`no practice type for "x"`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** the gates → PASS.
- [ ] **Step 5: Commit** `feat: wave 2 item shapes (panels, tool lists, plugin review)`

### Tasks 18–22: Wave 2 units

Each follows the content-task rules: 4–7 cards, 10–14 items, facts first (F-numbers below are new sections this task adds), and a unit test asserting status `ready` plus the listed mix.

| Task | Unit key | Outline | New facts | Item mix (minimum) | Try it |
|---|---|---|---|---|---|
| 18 | `powers` | § 6 | F19 (root refusal, env inheritance, `sandbox.credentials`) | 3 decode, 3 predict, 2 pairs | — |
| 19 | `mcp` | § 7 | F20 MCP scopes/commands/OAuth/`.mcp.json`/connectors/limits | 3 scopes, 2 poisoned, 3 approve (MCP tools, no `auto`) | `claude mcp list` / `remove`, `/mcp` |
| 20 | `extensions` | § 8 | F21 skills, F22 plugins, F23 subagents | 3 review, 2 settings (skill `allowed-tools`, plugin hook), 2 setup (scope), 2 approve | "Review before you install" (`/plugin`) |
| 21 | `installing` | § 9 | F15 (extend), F24 package/install facts | 3 package, 3 settings, 2 approve | — |
| 22 | `sandboxes` | § 10 | F25 sandbox (extend F10), F26 isolation options | 3 inside, 3 allowlist, 2 trim, 2 setup | `/sandbox`, then check with `touch ~/sandbox-probe` (no `copy` on the probe) |

Commit each as `content: add unit N <key>`.

### Task 23: Boss: Continue? Y/N

**Files:**
- Create: `src/quiz/Boss.tsx` (+ css, test), `src/quiz/boss.ts` (+ test), `content/units/boss.json`
- Modify: `src/content/types.ts` (`UnitMeta.mode?: 'boss'`), `src/content/validate.ts` (+ test), `src/App.tsx`, `src/state/app.ts`, `src/i18n/ui.ts`, `content/course.json`, `e2e/learn-practice.spec.ts`, `e2e/layout.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export const BOSS_SECONDS = 60;
  export function bossReducer(s: BossState, a: BossAction): BossState;   // boss.ts
  export interface BossState { queue: string[]; idx: number; left: number; answers: { id: string; choice: ApproveChoice; ok: boolean }[]; phase: 'intro' | 'run' | 'recap' }
  export type BossAction = { type: 'start' } | { type: 'answer'; choice: ApproveChoice } | { type: 'tick' };
  ```
  - A boss unit is `mode: 'boss'`. Its body has 1–3 cards and 18–24 terminal Manual-mode approve items, ~70% harmless.
  - The validator applies these ranges instead of 4–7/10–14 when `mode === 'boss'`.
  - The run has no hearts. Time runs out after `BOSS_SECONDS`. The recap lists every answered prompt with allowed/denied, the outcome feedback as a one-line lesson, the headline for dangerous approvals, and the item's `more` link.
  - `prefers-reduced-motion` disables the countdown animation but not the timer. A "Pause" button stops the timer, for accessibility.

- [ ] **Step 1: Write failing tests**
  - `boss.test.ts`:
    - `tick` at `left: 1` moves to `recap`;
    - `answer` records `ok` per `accept`;
    - answering after `recap` is ignored.
  - `Boss.test.tsx`:
    - the recap shows a BREAKING headline for a dangerous Yes;
    - Pause stops ticks (fake timers).
  - Validator: boss unit sizes.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, with App routing `openPractice` for a boss unit to `Boss`.
- [ ] **Step 4: Write `boss.json`** (items fresh, not copied from other units; facts F1, F4) and set `boss` ready.
- [ ] **Step 5: e2e.** In `layout.spec.ts`, walk the boss intro, answer all items quickly, and check the recap fits at 390px. In `learn-practice.spec.ts`, check that time running out shows the recap (inject a short duration through a `?bossSeconds=3` query param read only in dev/test builds via `import.meta.env.MODE !== 'production'`).
- [ ] **Step 6: Run** the gates and e2e → PASS.
- [ ] **Step 7: Commit** `feat: boss unit Continue? Y/N`
