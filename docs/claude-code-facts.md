# Claude Code facts sheet

The single source for every claim about Claude Code in units 2–5 and for the look of simulated permission prompts. Content cites sections by number (e.g. `F4`). Bullets starting `UNVERIFIED:` are not settled by official docs; content must not state them as true.

Docs describe Claude Code v2.1.306 era (installed CLI: `claude` 2.1.306). Exact UI wording is in backticks or bold as the docs give it.

## F1 Terminal permission prompt

- Layout (Bash, from the docs' screenshot description): title `Bash command`; a one-line description of what Claude wants (e.g. `Run the test suite`); the command itself (e.g. `npm test`); the line `This command requires approval`; the question `Do you want to proceed?`; numbered options; footer keys `Esc to cancel` and `Tab to amend`. In Manual mode a tip about auto mode may sit above the description.
- Bash options, in order: `Yes` / `Yes, and don't ask again for: npm test *` (option 2 names the command pattern it will save) / `Yes, and switch to auto mode` / `No`.
- Option 3 (`Yes, and switch to auto mode`) appears only on Bash prompts, in Manual and `acceptEdits` modes, when auto mode is available, and not on prompts forced by an `ask` rule or a hook.
- Some prompts offer only one-time approval (no "don't ask again"): Claude Code offers the saving options only when the prompt can show everything they would allow.
- On most prompts (Bash, file, MCP tool), moving to `Yes` or `No` and pressing `Tab` opens a comment field to send Claude a note. WebFetch and browser prompts don't offer it. `No` with no comment stops Claude's turn.
- Web fetch options: `Yes` (this fetch only) / `Yes, and don't ask again for <domain>` (saves a `WebFetch(domain:...)` rule) / `No, and tell Claude what to do differently`.
- File edit: option 2 allows the action for the rest of the session (it is the option `Shift+Tab` selects on a file prompt). For writes to `.claude/` the docs give the wording `Yes, and allow Claude to edit files in this project's .claude folder for this session` (and `Yes, and allow Claude to edit files in its ~/.claude folder for this session` for `~/.claude/`).
- UNVERIFIED: the exact title, question line and option-2 wording of an ordinary file edit prompt (Edit/Write). Searched permissions, permission-modes, tools-reference, interactive-mode, settings, quickstart, common-workflows, best-practices pages; none quote it.
- UNVERIFIED: the exact title/question line of the web fetch prompt (only its three options are documented).
- UNVERIFIED: the exact layout and option-2 wording of an MCP tool prompt. Docs confirm MCP tool prompts exist and take the `Tab` comment field; an MCP tool marked `requiresUserInteraction` never offers "don't ask again". No quoted layout found in the mcp or permissions pages.
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/tools-reference
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/interactive-mode
Source: https://code.claude.com/docs/en/mcp
Checked: 2026-10-21

## F2 Desktop app permission prompt

- Desktop = the **Code** tab of the Claude desktop app. The permission mode selector sits in the row under the prompt box.
- File edits in **Manual** mode: Claude proposes each change and waits; you see a diff view of exactly what will change in each file and **Accept**/**Reject** buttons ("Accept/Reject buttons to approve or decline each change").
- Browser pane, acting on an external site (first time per site): a permission card with **Allow once**, **Always allow**, **Deny**. **Allow once** saves nothing; **Always allow** saves approval for that site on your device (revocable in Settings). Each site, including each subdomain, needs its own approval.
- Computer use (separate feature): the first time Claude needs an app, a prompt offers **Allow for this session** or **Deny**.
- Desktop shows an approval card before Claude archives a session (except in Auto and Bypass permissions).
- UNVERIFIED: the layout and exact labels of the desktop prompt for a shell command, a web fetch, or an MCP tool call (e.g. whether it has a "don't ask again"/"always allow" option). The desktop and desktop-quickstart pages don't describe it; only the edit Accept/Reject buttons and the browser/computer-use cards are documented.
Source: https://code.claude.com/docs/en/desktop-quickstart
Source: https://code.claude.com/docs/en/desktop
Checked: 2026-10-21

## F3 What asks by default (Manual mode)

- Reads (Read, Grep, Glob, file reads): no prompt inside the working directory and added directories; prompt outside them.
- File edits / writes: ask. "Don't ask again" lasts until the session ends.
- Bash commands: ask, except a built-in read-only set (`ls`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, read-only `git`) that runs without a prompt in every mode. Network commands like `curl` and `wget` are not auto-approved. Commands Claude Code can't fully parse always ask.
- Web fetch: asks, except a built-in set of preapproved documentation domains.
- Web search: asks.
- MCP tools: prompts exist for MCP tools; an MCP tool the server marks `requiresUserInteraction`, or a connector tool your organization set to `ask`, prompts on every call in every mode.
- UNVERIFIED: an explicit doc statement that every ordinary MCP tool call asks by default in Manual mode (the permissions table lists only read-only, Bash, file modification, WebFetch, WebSearch).
- Important: with v2.1.283+, interactive terminal (and VS Code) sessions start in **auto** mode by default, not Manual. Manual applies when you pick it, set it as default, or auto is unavailable.
- Permission rules are enforced by Claude Code, not the model: instructions in a prompt or CLAUDE.md don't change what is allowed.
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/tools-reference
Source: https://code.claude.com/docs/en/security
Source: https://code.claude.com/docs/en/permission-modes
Checked: 2026-10-21

## F4 Permission modes

| Config value | Terminal status bar | Desktop selector | Without asking |
|---|---|---|---|
| `default` | `⏸ manual mode on` | **Manual** | Reads only |
| `acceptEdits` | `⏵⏵ accept edits on` | **Accept edits** | Reads, file edits, common filesystem commands (`mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, `sed`) inside the working directory |
| `plan` | `⏸ plan mode on` | **Plan** | Reads; explores and proposes a plan, doesn't edit source |
| `auto` | `⏵⏵ auto mode on` | **Auto** | Everything, with background safety checks |
| `dontAsk` | `⏵⏵ don't ask on` | not in desktop (CLI only) | Only pre-approved tools; anything that would prompt is denied |
| `bypassPermissions` | `⏵⏵ bypass permissions on` | **Bypass permissions** | Everything (containers/VMs only) |

- The mode is named **Manual** in the CLI, `claude --help`, and the desktop app; `manual` is accepted as an alias of `default`. `claude --help` lists `--permission-mode` choices: `"acceptEdits", "auto", "bypassPermissions", "manual", "dontAsk", "plan"`.
- Terminal: `Shift+Tab` cycles modes (from auto: Manual → accept edits → plan → …). Desktop: mode selector under the prompt box; a pick is remembered per folder (Plan applies to the current session only).
- UNVERIFIED: earlier desktop labels for these modes (e.g. "Ask permissions", "Auto accept edits", "Plan mode"); no current doc quotes them.
- Built-in starting mode: auto for interactive terminal sessions (v2.1.283+); `claude -p` starts in Manual.
- UNVERIFIED: the desktop app's built-in starting mode for a new local session (desktop docs say a picked mode is remembered per folder and `defaultMode` applies, but don't state the built-in default).
- Auto mode, what decides: a separate classifier model (a second model, default Claude Sonnet 5; or a server-side review) checks actions before they run, instead of you. It blocks actions that escalate beyond your request, target unrecognized infrastructure, or appear driven by hostile content Claude read. Reads and file edits in the working directory skip the classifier; shell commands and network actions go to it. The classifier sees your messages, tool calls and CLAUDE.md, but tool results are stripped, so text in a file or web page can't address it directly.
- Blocked by default (examples): `curl | bash`, sending sensitive data to external endpoints, production deploys, force push, mass cloud deletion, irreversibly destroying pre-existing files, printing a live credential, Claude in Chrome actions that could send page content, cookies or credentials off-origin.
- What it can still let through (allowed by default): local file operations in the working directory; installing dependencies declared in lock files/manifests; reading `.env` and sending credentials to their matching API; read-only HTTP requests; pushing to any branch of the current repo; Claude in Chrome navigation to a trusted internal domain, localhost, or a URL you named. Telling Claude in chat that a blocked action is OK can clear the block for that action.
- Docs warning: "Auto mode reduces permission prompts but does not guarantee safety."
- Fallback: 3 blocks in a row or 20 in total pause auto mode and prompting resumes. Explicit `ask` rules still prompt in auto mode.
- Availability: all plans; needs a supported model (Anthropic API: Opus 4.6+, Sonnet 4.6+, Haiku 5.5, Fable); admins can turn it off with `disableAutoMode`.
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/desktop
Checked: 2026-10-21

## F5 What "don't ask again" saves, and where

- Bash command: a permanent `allow` rule per repository and command (e.g. `Bash(npm test *)`); a compound command saves one rule per subcommand (up to 5).
- Web fetch: a permanent `WebFetch(domain:<domain>)` allow rule per repository. Web search: permanent per repository.
- File edits: not saved to a file; the approval lasts until the session ends.
- Where: `.claude/settings.local.json` at the git repository root (the main checkout for worktrees). It applies to future sessions anywhere in that repository. Outside a git repo, when the repo root is your home folder, or on Windows, it stays next to `.claude/settings.json` in the starting folder.
- That file is personal (local scope): Claude Code adds `**/.claude/settings.local.json` to your global git excludes, so it isn't committed. In the CLI it writes only to this local file.
- Review or remove saved rules with `/permissions`.
- Desktop Browser pane: **Always allow** saves the site approval on your device, revocable in Settings.
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/settings
Source: https://code.claude.com/docs/en/desktop
Checked: 2026-10-21

## F6 When CLAUDE.md and memory load

- CLAUDE.md files (written by you) and auto memory (written by Claude) are both loaded at the start of every conversation. Claude treats them as context, not enforced configuration.
- At launch: CLAUDE.md and CLAUDE.local.md in the working directory and every directory above it; `~/.claude/CLAUDE.md` (user); org managed-policy CLAUDE.md; `@path` imports. All are concatenated.
- On demand: CLAUDE.md files in subdirectories load once Claude reads, writes or edits a file in that subdirectory.
- Auto memory: `~/.claude/projects/<project>/memory/`; the first 200 lines or 25KB of `MEMORY.md` load at every session start; other topic files are read only when needed.
- Project-root CLAUDE.md is re-read from disk after `/compact`.
- Block-level HTML comments in CLAUDE.md are stripped before reaching Claude's context.
Source: https://code.claude.com/docs/en/memory
Source: https://code.claude.com/docs/en/how-claude-code-works
Checked: 2026-10-21

## F7 Built-in tools, in plain words

- File operations: read files (`Read`), make targeted edits (`Edit`), create or overwrite files (`Write`), edit notebooks (`NotebookEdit`).
- Search: find files by pattern (`Glob`), search inside files (`Grep`).
- UNVERIFIED: that `Glob`/`Grep` are absent by default on macOS/Linux, with Claude searching through shell commands instead.
- Execution: run shell commands as you (`Bash`; `PowerShell` on Windows), watch a command in the background (`Monitor`). "Any command you could run… Claude can too."
- Web: fetch a page (`WebFetch`; a separate model call summarizes the page for Claude) and search the web (`WebSearch`).
- Other: start a helper agent (`Agent`), ask you multiple-choice questions (`AskUserQuestion`), run a skill (`Skill`), task lists, plan mode, code intelligence (`LSP`).
- MCP servers add more tools; skills, hooks and subagents extend Claude on top of the built-in tools.
- Agentic loop (docs): gather context → take action → verify results, repeated; each tool result feeds back into Claude's next decision; you can interrupt anytime.
Source: https://code.claude.com/docs/en/how-claude-code-works
Source: https://code.claude.com/docs/en/tools-reference
Checked: 2026-10-21

## F8 Browser control

- Terminal: the official route is the **Claude in Chrome** extension, started with `claude --chrome` (help: `Enable Claude in Chrome integration`) or `/chrome` → **Enabled by default**. Works with Chrome, Edge and other Chromium browsers.
- It uses your everyday browser: Claude "shares your browser's login state, so it can access any site you're already signed into", opening new tabs in a visible Chrome window. It can fill forms, upload files from your machine, read console and DOM, and record GIFs. On a login page or CAPTCHA it pauses for you.
- Its prompt starts with `Claude in Chrome wants to` and offers to allow all actions on that site for the session. Site permissions are managed in the extension's settings.
- Other browser-control MCP servers can be connected like any MCP server (the docs use a `puppeteer` server as a rule example).
- UNVERIFIED: whether third-party browser-control MCP servers (Playwright, Puppeteer, Chrome DevTools) use the everyday Chrome profile. That depends on each server and isn't covered by Claude Code docs.
- Desktop app: a built-in **Browser** pane (Cmd+Shift+B / Ctrl+Shift+B), a tabbed browser. It "uses a clean browser profile, separate from your personal browser, with none of your saved logins or history."
- But you can sign in to sites inside the pane (including Google OAuth pop-ups), and **Keep cookies** can keep those logins after you quit. Whatever you sign into there is within Claude's reach.
- Safeguards in the Browser pane: safety classifiers review Claude's clicks and typing on external pages in every mode; outside Auto/Bypass, a domain allowlist check runs before navigating to a new site; first action per site needs **Allow once** / **Always allow** / **Deny**. Claude won't purchase, create accounts or bypass CAPTCHAs without your input.
- Docs advice: use the Browser pane for testing and sites that don't need your identity; use the Chrome extension when you want Claude to act as you in logged-in sessions.
Source: https://code.claude.com/docs/en/chrome
Source: https://code.claude.com/docs/en/desktop
Source: https://code.claude.com/docs/en/permissions
Checked: 2026-10-21

## F9 How MCP tools are named

- Full tool name: `mcp__<server>__<tool>`, e.g. `mcp__puppeteer__puppeteer_navigate`; all tools of a server: `mcp__<server>__*`.
- Characters such as `.` or spaces in a server name become `_`.
- Plugin servers: `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`.
- claude.ai connectors fetched by Claude Code: `mcp__claude_ai_<server>__<tool>`.
- `/mcp` → select a tool shows its full name.
- UNVERIFIED: how the tool name is displayed in the terminal MCP permission prompt itself (e.g. a "server - tool (MCP)" title). No official doc quotes the prompt.
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/mcp
Checked: 2026-10-21

## F10 What the built-in sandbox restricts

- An OS-enforced boundary around the shell commands Claude runs (Bash, PowerShell, Monitor) and the processes they start. Off by default; turn on with `/sandbox` or `sandbox.enabled`. macOS, Linux, WSL2 only (not native Windows).
- Writes: only the working directory, a per-user temp folder and added directories; protected paths stay write-denied.
- Reads: most of the machine by default, **including** `~/.ssh` and `~/.aws/credentials` unless you deny them.
- Network: no direct route out; a local proxy allows only listed domains (empty at start). Other hosts: a prompt in Manual/acceptEdits, refused in auto unless approved per command. Names resolving to local addresses (e.g. `169.254.169.254` cloud metadata) are refused.
- Environment variables, including secrets, are inherited unless configured.
- Not covered: Claude's file and web tools (Read, Edit, Write, WebFetch, WebSearch), MCP servers, hooks; commands you type with `!`; excluded commands; unsandboxed retries Claude can ask for.
Source: https://code.claude.com/docs/en/sandboxing
Checked: 2026-10-21
