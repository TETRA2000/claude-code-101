# Claude Code 101

A bilingual (English/Japanese) Vite + React + TypeScript course app that teaches Claude Code through short Learn cards and Duolingo-style practice. It runs entirely in the browser with no real AI and no command execution. The full design is in `docs/superpowers/specs/2026-10-21-claude-code-101-design.md`.

## Global Constraints

- Every learner-facing string is a `Localized` (`{ en: string; ja: string }`), and both values are non-empty. English is written first. Japanese is a full, natural translation, with no review step.
- Commands, file paths, code, URLs, tool names and terminal output are never translated. They live in plain `string` fields.
- UI strings live in `src/i18n/ui.ts`, typed so a missing Japanese key fails `tsc`. Components never hard-code learner-facing text. Lesson text lives only in `content/*.json`.
- Language default: the stored choice, else `ja` if the browser's first language starts with `ja`, else `en`. Keep `<html lang>` in sync.
- No real AI, no command execution, no network requests except loading the site and Google Fonts (Bricolage Grotesque, DM Sans, JetBrains Mono, Noto Sans JP).
- Content safety:
  - Fake secrets contain `FAKE`.
  - URLs use reserved hosts (`*.example`, `example.com|net|org` and subdomains, `*.test`, `*.invalid`, `localhost`) or the real-host allowlist in `src/content/hosts.ts`.
  - Copy buttons appear only on safe snippets in Try it cards (`copy: true`; the validator rejects unsafe code).
- Rules: `HEARTS_PER_RUN = 5`, `XP_FIRST_TRY = 10`, `XP_RETRY = 5`, `XP_HINT_COST = 5` (taken off that item's award, never below 0), `ACTIVATION_GUARD_MS = 350`.
- Ready units have 4–7 Learn cards and 10–14 practice items; a card's English `body` plus `key` is at most 100 words (`try` and `deep` are not counted). Every ready unit has `lastChecked` (`YYYY-MM-DD`), `linksChecked` (`YYYY-MM-DD`) and 3–8 `docs` entries (slug + note, in both languages).
- Boss exception (unit 13, `mode: 'boss'` in `course.json`): 1–3 intro cards, no `items`, and 18–24 `picks`. Each pick is the id of a published `approve` item in another ready unit. The loader (`src/content/picks.ts`) copies the picks into `items` in pick order. Each copy gets `fromUnit`, falls back to that unit's first `docs` entry for `more`, and drops `decode`. The validator checks that every pick exists, is not a duplicate, is never graded right for `auto`, mixes terminal and desktop prompts, and that 60–80% are harmless (`accept` includes `yes`). Never write new boss prompts; pick published ones. A boss file's own `items` are an error. A boss run with no answers is not reported as done.
- Approve headlines never start with `BREAKING:` or `速報：`; the Breaking badge already says it (the validator rejects it).
- Design tokens are copied from cascade-learn's `src/styles/tokens.css`. Accessibility:
  - real `<button>`s, `aria-pressed` on selectable tiles, `aria-live` feedback, `role="progressbar"` with values;
  - targets ≥44px, contrast ≥4.5:1;
  - right/wrong shown with icon and text, not color alone;
  - `prefers-reduced-motion` respected.
- Laptop first, but no horizontal page scroll at 390px width. Long commands and URLs wrap (`overflow-wrap: anywhere`).
- Each item says which app it shows: `surface: 'terminal' | 'desktop'`. Unit 3 recommends Manual (ask before acting); unit 12 teaches auto mode. Turning permissions off is always wrong in setup items.
- Approve `auto` ("Yes, and switch to auto mode"): offered exactly for terminal Bash prompts without an `askRule` (the validator enforces it), and never an accepted answer in units `permissions`, `injection`, `browser` and `boss`.

## Commands

- `npm run dev` runs the app. `?bossSeconds=N` shortens the boss run; it is read only when `import.meta.env.MODE !== 'production'`. `npm run typecheck`, `npm test` (vitest) and `npm run build` are the gates; `npm run test:e2e` runs Playwright on a 1280x800 `desktop` and a 390x844 `phone` project (first run: `npx playwright install chromium`).
- E2E specs: `learn-practice` (learn, one miss, finish, XP kept; the boss times out to its recap via `?bossSeconds=3`, and counts as done only after at least one answer), `language` (switch mid-run, persisted), `layout` (every Learn card and practice screen in both languages has `scrollWidth <= innerWidth`, no copy buttons, soon units are inert; it opens each Try it Desktop tab and each Under the hood section; copy buttons exist only inside Try it, each with a distinct name; the boss walks its intro, every prompt and the recap, with `?bossSeconds=600`). `e2e/helpers.ts` solves any item from the content JSON.

## File map

```
index.html  package.json  tsconfig.json  vite.config.ts  playwright.config.ts  .nvmrc  .gitignore  CLAUDE.md
.github/workflows/ci.yml        CI: typecheck, unit tests, build, Playwright
content/course.json             all 13 units: meta, status, chips, lastChecked, linksChecked, docs
content/practice-types.json     chip/type names
content/units/<key>.json        one per ready unit: { cards, items }; boss.json is { cards, picks }
docs/claude-code-facts.md       sourced facts; every Claude Code claim in content cites it
src/main.tsx  src/App.tsx       entry; screen switch, persistence, <html lang> sync
src/styles/                     tokens.css, global.css
src/i18n/                       lang.ts (Localized, detectLang), ui.ts (UI strings en+ja), LangContext.tsx
src/content/                    types.ts, index.ts (course eager; each unit body lazy-loaded on open, a boss also loads the units it picks from), picks.ts (boss picks → items), validate.ts, hosts.ts (URL allowlist), approve.ts (choicesOf), docs.ts (doc slugs, link hosts, docHref); tests: validate.test.ts, content.test.ts (validates the real content)
src/rules/                      match.ts (permission-rule parser and matcher), OutcomeTag.tsx; tests: match.test.ts
src/state/                      rules.ts (hearts, XP, guard), app.ts (reducer)
src/storage/progress.ts         localStorage progress, never throws
src/quiz/                       types.ts (session/answer state), session.ts (pure reducer), grade.ts, feedback.ts, useArmed.ts, Quiz.tsx, FeedbackSheet.tsx, QuizEnd.tsx; boss.ts (timed boss reducer, BOSS_SECONDS = 60), Boss.tsx (intro, run with Pause, recap)
src/quiz/renderers/             one per item type: Approve, PermissionPrompt, RuleBuilder, Choice, PairBoard, OrderList, HiddenDoc, Chain, SettingsFile, Precedence, AutoMode, BrowserFrame, TerminalFrame, ItemBody
src/screens/                    Home.tsx, Learn.tsx, Loading.tsx (unit loading/failed state), cards/ (DocsList, TryIt, Deep), demos/ (TerminalDemo, ContextDemo, AnatomyDemo, SettingsDemo, ModesDemo, RulesDemo)
src/components/                 Button, DocLink, ProgressBar, HeartCount, RichText, LangSwitch, icons
src/test/                       setup.ts (vitest setup), fixtures.ts (a demo unit with every card/item shape, plus a boss and the units it picks from)
e2e/                            Playwright specs + helpers.ts (reads every content/units/*.json)
```

Each `.tsx` with styles has a sibling `.module.css`; tests sit next to their file as `*.test.ts(x)`.

## Content tasks

- Write `content/units/<key>.json`, set the unit's `status` to `ready` in `content/course.json` (plus `lastChecked` and `linksChecked` as `YYYY-MM-DD`, and 3–8 `docs` entries, each a slug from `src/content/docs.ts` or an allowed full URL plus a "read this if…" note), then run `npm test`. Ready units need 4–7 cards (≤100 English words of body + key each) and 10–14 items.
- Every Claude Code claim (tool names, modes, prompts, settings) must match `docs/claude-code-facts.md`; add a sourced entry there first if a fact is missing.
- Unit contents are discovered by a lazy Vite glob; `content.test.ts` awaits `content.loadAll()` before validating. After adding or renaming a unit file, clear `node_modules/.vitest-cache` (and any `.vitest-cache`) if tests do not see it.
- Planted attack text (injection lessons: hidden instructions, fake "pre-approved" notes, poisoned CLAUDE.md lines) is inert teaching material. It may only ask for harmless, obviously fake actions on reserved hosts (`*.example`, `example.com|net|org`, `*.test`, `*.invalid`, `localhost`) with fake secrets containing `FAKE`. Never use real hosts outside the `src/content/hosts.ts` allowlist, real credentials, or text that would work as an attack against a real tool. Planted text never gets a copy button, so nobody can copy it out.
- No E2E edit is needed per unit: `e2e/helpers.ts` reads every `content/units/*.json` (resolving boss picks), and `e2e/layout.spec.ts` walks every ready unit in both languages. Long commands and URLs must wrap (`overflow-wrap: anywhere`).
