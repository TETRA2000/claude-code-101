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
- Ready units have 3–5 Learn cards and 8–12 practice items. Every ready unit has `lastChecked` (`YYYY-MM-DD`), `linksChecked` (`YYYY-MM-DD`) and 3–8 `docs` entries (slug + note, in both languages).
- Design tokens are copied from cascade-learn's `src/styles/tokens.css`. Accessibility:
  - real `<button>`s, `aria-pressed` on selectable tiles, `aria-live` feedback, `role="progressbar"` with values;
  - targets ≥44px, contrast ≥4.5:1;
  - right/wrong shown with icon and text, not color alone;
  - `prefers-reduced-motion` respected.
- Laptop first, but no horizontal page scroll at 390px width. Long commands and URLs wrap (`overflow-wrap: anywhere`).
- Each item says which app it shows: `surface: 'terminal' | 'desktop'`. Unit 3 recommends the default "ask before acting" mode. Turning permissions off is always wrong in setup items.

## Commands

- `npm run dev` runs the app. `npm run typecheck`, `npm test` (vitest) and `npm run build` are the gates; `npm run test:e2e` runs Playwright on a 1280x800 `desktop` and a 390x844 `phone` project (first run: `npx playwright install chromium`).
- E2E specs: `learn-practice` (learn, one miss, finish, XP kept), `language` (switch mid-run, persisted), `layout` (every Learn card and practice screen in both languages has `scrollWidth <= innerWidth`, no copy buttons, soon units are inert). `e2e/helpers.ts` solves any item from the content JSON.

## File map

```
index.html  package.json  tsconfig.json  vite.config.ts  playwright.config.ts  .nvmrc  .gitignore  CLAUDE.md
.github/workflows/ci.yml        CI: typecheck, unit tests, build, Playwright
content/course.json             all 13 units: meta, status, chips, lastChecked, linksChecked, docs
content/practice-types.json     chip/type names
content/units/<key>.json        one per ready unit: { cards, items }
docs/claude-code-facts.md       sourced facts; every Claude Code claim in content cites it
src/main.tsx  src/App.tsx       entry; screen switch, persistence, <html lang> sync
src/styles/                     tokens.css, global.css
src/i18n/                       lang.ts (Localized, detectLang), ui.ts (UI strings en+ja), LangContext.tsx
src/content/                    types.ts, index.ts (loads units), validate.ts, hosts.ts (URL allowlist), docs.ts (doc slugs, link hosts, docHref); tests: validate.test.ts, content.test.ts (validates the real content)
src/state/                      rules.ts (hearts, XP, guard), app.ts (reducer)
src/storage/progress.ts         localStorage progress, never throws
src/quiz/                       types.ts (session/answer state), session.ts (pure reducer), grade.ts, feedback.ts, useArmed.ts, Quiz.tsx, FeedbackSheet.tsx, QuizEnd.tsx
src/quiz/renderers/             one per item type: Approve, PermissionPrompt, Choice, PairBoard, OrderList, HiddenDoc, Chain, SettingsFile, Precedence, BrowserFrame, TerminalFrame, ItemBody
src/screens/                    Home.tsx, Learn.tsx, cards/ (DocsList, TryIt, Deep), demos/ (TerminalDemo, ContextDemo, AnatomyDemo, SettingsDemo)
src/components/                 Button, DocLink, ProgressBar, HeartCount, RichText, LangSwitch, icons
src/test/                       setup.ts (vitest setup), fixtures.ts (a demo unit with every card/item shape)
e2e/                            Playwright specs + helpers.ts (reads every content/units/*.json)
```

Each `.tsx` with styles has a sibling `.module.css`; tests sit next to their file as `*.test.ts(x)`.

## Content tasks

- Write `content/units/<key>.json`, set the unit's `status` to `ready` in `content/course.json` (plus `lastChecked` and `linksChecked` as `YYYY-MM-DD`, and 3–8 `docs` entries, each a slug from `src/content/docs.ts` or an allowed full URL plus a "read this if…" note), then run `npm test`. Ready units need 3-5 cards and 8-12 items.
- Every Claude Code claim (tool names, modes, prompts, settings) must match `docs/claude-code-facts.md`; add a sourced entry there first if a fact is missing.
- Unit contents are discovered by a Vite glob at test time. After adding or renaming a unit file, clear `node_modules/.vitest-cache` (and any `.vitest-cache`) if tests do not see it.
- Planted attack text (injection lessons: hidden instructions, fake "pre-approved" notes, poisoned CLAUDE.md lines) is inert teaching material. It may only ask for harmless, obviously fake actions on reserved hosts (`*.example`, `example.com|net|org`, `*.test`, `*.invalid`, `localhost`) with fake secrets containing `FAKE`. Never use real hosts outside the `src/content/hosts.ts` allowlist, real credentials, or text that would work as an attack against a real tool. Planted text never gets a copy button, so nobody can copy it out.
- No E2E edit is needed per unit: `e2e/helpers.ts` reads every `content/units/*.json`, and `e2e/layout.spec.ts` walks every ready unit in both languages. Long commands and URLs must wrap (`overflow-wrap: anywhere`).
