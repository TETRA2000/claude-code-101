# Claude Code facts sheet

The single source for every claim about Claude Code in units 2–5 and for the look of simulated permission prompts. Content cites sections by number (e.g. `F4`). Bullets starting `UNVERIFIED:` are not settled by official docs; content must not state them as true.

Docs describe Claude Code v2.1.306 era (installed CLI: `claude` 2.1.306). Exact UI wording is in backticks or bold as the docs give it.

## F1 Terminal permission prompt

- Layout (Bash, from the docs' screenshot description): title `Bash command`; a one-line description of what Claude wants (e.g. `Run the test suite`); the command itself (e.g. `npm test`); the line `This command requires approval`; the question `Do you want to proceed?`; numbered options; footer keys `Esc to cancel` and `Tab to amend`. In Manual mode a tip about auto mode may sit above the description.
- Bash options, in order: `Yes` / `Yes, and don't ask again for: npm test *` (option 2 names the command pattern it will save) / `Yes, and switch to auto mode` / `No`.
- Option 3 (`Yes, and switch to auto mode`) appears only on Bash prompts, in Manual and `acceptEdits` modes, when auto mode is available, and not on prompts forced by an `ask` rule or a hook.
- Some prompts offer only one-time approval (no "don't ask again"): Claude Code offers the saving options only when the prompt can show everything they would allow. "When a prompt offers only the one-time approval, approve the action once, or add the rule yourself in `/permissions`." Examples the docs name: commands starting with an exec wrapper such as `watch`, and `find` with an action such as `-delete`. (permissions#permission-system; checked 2026-10-22.)
- MCP tool marked `_meta["anthropic/requiresUserInteraction"]`: "Claude Code shows that tool's permission prompt on every call, even in `acceptEdits`, `auto`, and `bypassPermissions` permission modes, and doesn't offer a "don't ask again" option for it." Allow rules don't skip it; `dontAsk` denies it. Meant for "a consent or access-grant step where auto-approval would mean no human ever agreed." (mcp#require-approval-for-a-specific-tool; checked 2026-10-22.)
- `Tab` comment details: the options that allow the action for the rest of the session or save a rule don't take a comment. `No` with a comment: "Claude Code sends your comment to Claude as the reason for the denial, and Claude continues working." (permissions#add-a-comment-when-you-answer-a-permission-prompt; checked 2026-10-22.)
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
- Starting mode in a settings file: `permissions.defaultMode`, e.g. `{ "permissions": { "defaultMode": "default" } }` in `~/.claude/settings.json` for every terminal session on the machine; "The next session you start shows `⏸ manual mode on` in the status bar." The CLI accepts `manual` as an alias "wherever you type the value, for example `claude --permission-mode manual` or `"defaultMode": "manual"`." If `~/.claude/settings.json` sets a `defaultMode` other than `auto` and no other file sets one, sessions keep starting in it; on Pro, Max and Team plans Claude Code "asks once … whether to change the setting to auto mode. If you decline, your setting stays as it is." (permission-modes#which-mode-a-session-starts-in, #start-in-a-different-permission-mode; checked 2026-10-22.)
- Plan mode detail: "Reads, plus classifier-approved commands when auto mode is available"; without auto mode, commands outside the read-only set prompt. Edits stay blocked until you approve the plan. Desktop's Accept edits row names `mkdir`, `touch` and `mv` as the common filesystem commands it auto-accepts. `dontAsk` is available only in the CLI. (permission-modes#available-modes, desktop#choose-a-permission-mode; checked 2026-10-22.)
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
- Review or remove saved rules with `/permissions`. "The dialog lists all permission rules and the `settings.json` file each rule comes from." When you add or remove a rule while Claude works, the change applies "starting with Claude's next tool call in the same turn." (permissions#manage-permissions; checked 2026-10-22.) In the desktop Code tab, `/permissions` replies `isn't available in this environment` (F17).
- Compound example: "approving `git status && npm test` saves a rule for `npm test`" (only subcommands that required approval get a rule).
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
- `Glob` and `Grep` are "Absent by default on macOS, Linux, and WSL": there Claude searches with `find` and `grep` through `Bash`, and those searches reach hooks and permission rules as `Bash` calls (tools-reference#glob-tool-behavior; checked 2026-10-22). On Windows they're in the default tool set.
- Execution: run shell commands as you (`Bash`; `PowerShell` on Windows), watch a command in the background (`Monitor`). "Any command you could run… Claude can too."
- Web: fetch a page (`WebFetch`; a separate model call summarizes the page for Claude) and search the web (`WebSearch`).
- Other: start a helper agent (`Agent`), ask you multiple-choice questions (`AskUserQuestion`), run a skill (`Skill`), task lists, plan mode, code intelligence (`LSP`).
- MCP servers add more tools; skills, hooks and subagents extend Claude on top of the built-in tools.
- Agentic loop (docs): gather context → take action → verify results, repeated; each tool result feeds back into Claude's next decision; you can interrupt anytime.
- Harness (docs): "The agentic loop is powered by two components: models that reason and tools that act. Claude Code is the layer around the model that provides the tools and manages the context the model sees. This surrounding layer is what the term agentic harness refers to." "Without tools, Claude can only respond with text." Claude Code also adds its own context alongside your messages (system reminders): your CLAUDE.md files, output-style instructions, a note when a file Claude read earlier changes on disk, commit/PR attribution lines. (Checked 2026-10-22.)
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
- Browser pane, exact docs wording: "The Browser pane uses a clean browser profile, separate from your personal browser, with none of your saved logins or history." "Safety classifiers review Claude's write actions on external pages, such as clicking and typing, in every permission mode. These are the same classifiers auto mode uses, and when they flag an action, you get a permission prompt regardless of mode." "In permission modes other than Auto and Bypass permissions, a domain allowlist check also applies before Claude navigates to a new site." First action per external site: **Allow once** (saves nothing) / **Always allow** (saved for that site on your device, revocable in Settings) / **Deny**; each site, including subdomains, needs its own approval; local dev servers and project files need none. "Even on an approved site, Claude won't purchase items, create accounts, or bypass CAPTCHAs without your input." The pane "uses the same safety model as the Claude in Chrome extension".
- Claude in Chrome file uploads: Claude Code reads the file and sends its contents to the browser. Claude refuses "a file whose name or folder is one that credentials are kept under, such as `.env`, a `.pem` or `.key` file, or anything under `.ssh`" (requires Claude Code v2.1.293 or later). Also refused: files with multiple hard links; uploads over 10 MB total. A `Read` deny rule on a file also blocks uploading it.
- Claude in Chrome GIF recording: "The recording captures everything visible in the browser, including account details on logged-in pages, so review it before sharing it outside your team."
- A project can't turn on Claude in Chrome: a `CLAUDE_CODE_ENABLE_CFC=1` in a project's `.claude/settings.json` or `.claude/settings.local.json` `env` block is ignored with a warning ("a project can't turn on Claude in Chrome. To turn it on yourself, run /chrome or start with --chrome."), because "a repository you check out must not be able to connect Claude to your browser."
- Computer use (desktop app): a research preview on macOS and Windows, Pro or Max plans only (not Team or Enterprise). "Computer use is off by default"; enable it in **Settings > This computer > System** → **Enable computer use** (macOS also needs Accessibility and Screen Recording permissions). The first time Claude needs an app, a prompt offers **Allow for this session** or **Deny**; approvals last for the current session (30 minutes in Dispatch-spawned sessions). Tiers are "fixed by app category and can't be changed": **View only** (see the app in screenshots) for browsers and trading platforms; **Click only** (click and scroll, but not type or use keyboard shortcuts) for terminals and IDEs; **Full control** (click, type, drag, keyboard shortcuts) for everything else. Apps with broad reach (terminals, Finder/File Explorer, System Settings) show an extra warning. Docs: unlike the sandbox, "computer use runs on your actual desktop with access to whatever you approve."
- Computer use in the CLI: a built-in MCP server called `computer-use` (macOS), "off by default until you enable it"; same per-app approval and tiers ("browsers and trading platforms are view-only, terminals and IDEs are click-only, and everything else gets full control"). Press `Esc` anywhere to abort.
- UNVERIFIED: the exact option labels of the Claude in Chrome permission prompt, which actions prompt individually (uploads included), and whether an upload prompt names the local file. The docs say only that the dialog starts with `Claude in Chrome wants to` and offers an option to allow all actions on that site for the session. Unit 5 items (approve-2, approve-5) are simulation assumptions: they title the prompt `Claude in Chrome`, paraphrase that option as "Yes, and allow all actions on <site> for this session", and show the uploaded file path.
- Turning Claude in Chrome on and off (chrome#enable-chrome-by-default, checked 2026-10-22): `/chrome` → **Enabled by default** connects every session; "Enabling Chrome by default increases context usage since the browser tools and their instructions are always loaded. If you notice increased context consumption, turn the setting off and connect only when needed, with `--chrome`". `/chrome` shows a `Status` line and a **Reconnect extension** option. `/mcp` → `claude-in-chrome` → **View tools** lists the browser tools.
- Site permissions and auto mode (chrome#manage-site-permissions, checked 2026-10-22): "Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on. In auto mode, when the auto mode classifier itself approves a browser call to a site, the extension skips its own per-site check for that call, unless your permission rules deny any site to Claude in Chrome."
- Browser pane housekeeping (desktop#preview-your-app, checked 2026-10-22): **Keep cookies** and **Clear browsing data** are in the Browser pane's **⋮** menu; "To turn the Browser off entirely, turn off **Browser tools** in **Settings > Claude Code**."
- Computer use safety (desktop#let-claude-use-your-computer, checked 2026-10-22): "Claude checks each action and flags potential prompt injection from on-screen content, but the trust boundary is different." Claude "tries the most precise tool first" (connector, Bash, Claude in Chrome, iOS Simulator pane) and uses computer use only when none apply; "computer use is the broadest and slowest".
Source: https://code.claude.com/docs/en/chrome
Source: https://code.claude.com/docs/en/desktop
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/computer-use
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

## F11 Settings files, scopes and precedence

- Four settings files plus managed settings; each has a scope:

| Scope | File | Who it affects |
|---|---|---|
| User | `~/.claude/settings.json` | You, in every project on this machine |
| Shared project | `.claude/settings.json` | Everyone working in the folder that contains it; in git, commit it so teammates get it |
| Project local | `.claude/settings.local.json` | You, in this one project only; Claude Code keeps it out of git when it creates the file (add it to `.gitignore` yourself if you create it by hand) |
| Managed | `managed-settings.json` and other managed sources (MDM policy, server-managed settings from the claude.ai console) | Everyone your organization deploys it to |

- Precedence, highest first: **managed settings → command line (`--settings <file-or-json>`, that session only) → project local → shared project → user**. A key set at a higher level overrides the same key lower down. Nothing in your own files or `--settings` overrides a managed key. `--settings` lasts one session and writes no file.
- Environment variables aren't a level in this stack (decided per pair of variable and key).
- Lists merge: "When you set the same list key, such as `permissions.allow`, in more than one file, Claude Code combines the lists instead of picking one, so each file can add entries without removing another file's." (Exceptions are four model-list keys: `fallbackModel`, `modelPicker`, `availableModels`, `modelSettings`.)
- Permission rules across files: a deny at any level beats an allow at any level ("if user settings allow a permission and project settings deny it, the deny rule blocks it", and a user-level deny blocks a project-level allow). An `allow` rule in your local file doesn't outrank an `ask` rule from a project or managed file.
- Check what loaded: `/status` → **Status** tab → the `Setting sources` line lists each settings file loaded for the session (e.g. `User settings`, `Project local settings`). It confirms which files were read, not which file supplied each key. `claude doctor` lists rejected entries.
- Keys a project file can't set: `permissions.defaultMode` values `auto` and `bypassPermissions` "don't take effect from project or local settings; set them in user or managed settings instead, or pass `--permission-mode` for one session." Before v2.1.257, `bypassPermissions` took effect from any file. Keys scoped `User`, `User or managed`, `Managed` or `Global config` are ignored in a repository file; `Global config` keys apply only from `~/.claude.json`.
- A few security keys honor a stricter value from a lower level even over managed (e.g. `permissions.blockReadsOutsideWorkingDirectories: true` from any scope, v2.1.257+).
- Settings files are strict JSON (no `//` comments, no trailing commas); a broken file shows a **Settings Error** at the next interactive start.
- Docs' own example for `~/.claude/settings.json`: `"allow": ["Bash(npm run lint)", "Bash(npm run test *)"]`, `"deny": ["Read(./.env)", "Read(./.env.*)"]`.
Source: https://code.claude.com/docs/en/settings
Source: https://code.claude.com/docs/en/permissions
Checked: 2026-10-21

## F12 Permission rule syntax and matching

- Format: `Tool` or `Tool(specifier)`. `Bash`, `WebFetch`, `Read` alone match every use of that tool; `Bash(*)` equals `Bash`. As a deny rule, a bare tool name removes the tool from Claude's context entirely; a scoped deny like `Bash(rm *)` leaves the tool and blocks matching calls.
- Specifier examples from the docs: `Bash(npm run build)` (exact command), `Read(./.env)` ("Matches reading the `.env` file in the current directory"), `WebFetch(domain:example.com)` (fetch requests to example.com).
- Order: "Rules are evaluated in order: deny, then ask, then allow. The first match in that order determines the outcome, and rule specificity doesn't change the order." "An allow rule can't carve an exception out of a deny rule." A matching ask rule prompts even when a more specific allow rule matches.
- Rules are enforced by Claude Code, not the model (see F3).
- Rules in every mode: "Deny rules block in every mode, including `bypassPermissions`." "Allow rules have no effect in `bypassPermissions`." Under "Actions no mode auto-approves": "Claude Code doesn't auto-approve the following in any mode, including `bypassPermissions`": first bullet "Tools matched by an explicit ask rule". With the sandbox in auto-allow mode, "Deny rules still apply, and ask rules that name a command, such as `Bash(git push *)`, still prompt." (permission-modes#available-modes, #actions-no-mode-auto-approves, #common-setups; checked 2026-10-22.)
- A prompt forced by an `ask` rule or a hook never offers `Yes, and switch to auto mode` (F1): "auto mode still shows you those prompts, so switching wouldn't remove them" (permission-modes#switch-permission-modes; checked 2026-10-22).
- A prompt forced by an `ask` rule very likely offers `Yes, and don't ask again`: the settings troubleshooting entry implies it ("You chose "Yes, and don't ask again" on a permission prompt but still get prompted for the same tool. That choice saved an `allow` rule to your local file, and an `allow` rule there doesn't outrank an `ask` rule from a project or managed file."). Picking it saves an allow rule that the ask rule still overrides. Not stated outright, so the course offers the option but never as the right answer (lockdown-approve-2). (settings#permission-rules-combine-differently-than-you-expected; checked 2026-10-22.)
- Docs anchor: the "What a Bash rule doesn't match" section is `permissions#bash-rule-limits` (checked in the rendered page 2026-10-22).
- Wildcards: a `*` in a Bash rule matches any text, including spaces; no `*` means one exact command. Docs warning: "Put the `*` after the subcommand"; `Bash(git log *)` allows only `git log` commands, `Bash(git *)` allows every git command. Claude Code warns at startup about an allow rule with `*` before the subcommand (e.g. `Bash(git * main)`).
- The docs' wildcard table:

| You write | Matches | Doesn't match |
|---|---|---|
| `Bash(npm run build)` | `npm run build` | `npm run build --watch` |
| `Bash(npm run *)` | `npm run build`, `npm run test --watch`, `npm run` | `npm install` |
| `Bash(git log * main)` | `git log --oneline main`, `git log -5 main`, `git log --output=<file> main` | `git log main`, `git push origin main` |
| `Bash(git * main)` | `git merge main`, `git push origin main`, `git -c core.fsmonitor=<script> diff main` | `git log` |
| `Bash(* --version)` | `node --version`, `bash -c 'echo hi' --version` | `node -v` |
| `Bash(ls *)` | `ls -la`, `ls` | `lsof` |
| `Bash(ls*)` | `ls -la`, `lsof` | |
| `Bash(* --help *)` | `npm --help x` | `npm --help` |

- Matching rules behind the table: the `*` stands in for whatever text is in its place; a trailing ` *` (space then `*`, when it's the only wildcard) also matches the bare command; the space before a trailing `*` is part of the rule.
- `:*` suffix: "an equivalent way to write a trailing wildcard, so `Bash(ls:*)` matches the same commands as `Bash(ls *)`." Recognized only at the end of a pattern (in `Bash(git:* push)` the colon is literal). The permission dialog writes the space-separated form.
- Compound commands: "a rule like `Bash(safe-cmd *)` won't give it permission to run the command `safe-cmd && other-cmd`. The recognized command separators are `&&`, `||`, `;`, `|`, `|&`, `&`, and newlines. A rule must match each subcommand independently." Deny and ask rules apply when any subcommand matches, including inside subshells, `$(...)` and loop bodies, even in auto mode. "Don't ask again" on a compound command saves one rule per subcommand needing approval (up to 5).
- Wrappers stripped before matching: `timeout`, `time`, `nice`, `nohup`, `stdbuf`, `command`, `builtin`, zsh `noglob`, bare `xargs`, and some known-safe env assignments. Not stripped: `npx`, `docker exec`, `direnv exec`, `devbox run`, `mise exec` (so `Bash(devbox run *)` matches `devbox run rm -rf .`).
- What a Bash rule doesn't match (rule in `deny` or `ask`):

| Rule | Stops | Doesn't stop |
|---|---|---|
| `Bash(curl *)` | `curl https://example.com` | `/usr/bin/curl https://example.com`, `sh -c 'curl https://example.com'` |
| `Bash(rm *)` | `rm -rf build/` | `/bin/rm -rf build/`, `bash -c 'rm -rf build/'` |
| `Bash(git push *)` | `git push origin main` | `git -C . push origin main`, `git -c push.default=current push origin main`, `git 'push' origin main` |

  Docs: a deny or ask rule "covers the invocation Claude usually produces and isn't a security boundary around the program." For enforcement independent of command text, use sandboxing; to inspect the full command, a PreToolUse hook.
- Fragile URL patterns (docs warning): "Bash permission patterns that try to constrain command arguments are fragile." `Bash(curl http://github.com/ *)` won't match options before the URL (`curl -X GET http://github.com/...`), a different protocol (`https://`), redirects (`curl -L http://short.example.com/xyz`), or variables (`URL=http://github.com && curl $URL`). Suggested instead: deny `curl`/`wget` and allow `WebFetch(domain:github.com)` (paired with the sandbox network allowlist when it must hold), PreToolUse hooks, or CLAUDE.md guidance (which "doesn't enforce a boundary"). "Using WebFetch alone doesn't prevent network access. If Bash is allowed, Claude can still use `curl`, `wget`, or other tools to reach any URL."
- Read/Edit rules: use gitignore pattern syntax. `//path` = absolute from filesystem root; `~/path` = from home; `/path` = relative to the settings source (e.g. project root for project settings, `~/.claude/` for user settings); `path` or `./path` = relative to current directory. A `Read` deny also blocks Edit and Write on the same path (Write: v2.1.228+). Read/Edit denies apply to built-in file tools, recognized Bash file commands (`cat`, `head`, `tail`, `sed`, `tee`) and redirect targets, but not to e.g. `grep -r pattern .` or a Python/Node script that opens files itself. `.claudeignore` has no effect.
- `WebFetch(domain:…)`: matches the hostname, case-insensitive. `WebFetch(domain:example.com)` matches `example.com` only; `WebFetch(domain:*.example.com)` matches any subdomain but not `example.com` itself; `WebFetch(domain:*)` matches every domain. Wildcards require v2.1.172+.
- MCP: `mcp__<server>__*` (or `mcp__<server>`) matches every tool of a server; `mcp__<server>__<tool>` one tool. Deny/ask rules accept tool-name globs such as `mcp__*`; allow globs only after a literal `mcp__<server>__` prefix.
Source: https://code.claude.com/docs/en/permissions
Checked: 2026-10-21

## F13 Hooks

- Hooks are your own commands that run at set points in Claude Code's lifecycle. `PreToolUse`: "Before a tool call executes. Can block it." PreToolUse hooks run before the permission prompt, for every tool except `EndConversation`; the output can deny the call, force a prompt, or skip the prompt.
- Exit codes: exit 0 from a `PreToolUse` hook doesn't approve the call (it still goes through the normal permission flow). Exit 2: write a reason to stderr; for `PreToolUse` it "Blocks the tool call" and Claude receives the reason as feedback. "A hook that exits with code 2 stops the tool call before permission rules are evaluated, so the block applies even when an allow rule would otherwise let the call proceed." Other exit codes are usually non-blocking errors.
- Hooks don't loosen rules: a hook returning `"allow"` doesn't bypass deny rules, and a matching ask rule still prompts.
- Every mode: "a hook's `"deny"` holds in every permission mode": "a hook that returns `permissionDecision: "deny"` blocks the tool even in `bypassPermissions` mode or with `--dangerously-skip-permissions`. `PreToolUse` hooks fire before any permission-mode check, in every permission mode, including `dontAsk`."
- Exception (docs note): with no managed settings and no Team/Enterprise `/login` credential, an installed mod handling `tool.check` can approve a call a PreToolUse hook blocked.
- Full permissions: "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access. Review and test all hook commands before adding them to your configuration." Hooks run outside the sandbox (sandboxing page lists command hooks among processes that "run with your full access").
- `/hooks`: "Type `/hooks` in Claude Code to open a read-only browser for your configured hooks." Each hook is labeled with where it comes from (user, project, local settings, a plugin, the session); selecting one shows the full text of what it runs and where it's defined.
- The docs' "Block edits to protected files" example: a script `.claude/hooks/protect-files.sh` reads the hook's JSON from stdin, extracts `.tool_input.file_path` with `jq`, checks it against `PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")`, and on a match prints `Blocked: $FILE_PATH matches protected pattern '$pattern'` to stderr and exits 2; otherwise exits 0. Make it executable (`chmod +x`), then register it in `.claude/settings.json` under `"hooks"` → `"PreToolUse"` with `"matcher": "Edit|Write"` and a `"type": "command"` hook running `"$CLAUDE_PROJECT_DIR"/.claude/hooks/protect-files.sh`. Test: ask Claude to add a comment to `.env`; the edit is blocked and Claude gets the `Blocked:` message as feedback.
- Matcher caveat: `"Edit|Write"` fires only for those tools, not when Claude changes files through `Bash`.
- Turn all hooks off for one run: `--settings '{"disableAllHooks": true}'` (a user-settings `true` can be overridden by a project's `false`).
- UNVERIFIED: an explicit doc sentence that a PreToolUse exit code 2 (as opposed to a JSON `permissionDecision: "deny"`) holds in `bypassPermissions` mode. The hooks-guide "every mode" sentence names the JSON `"deny"`; the permissions page says exit 2 stops the call before permission rules are evaluated, and that PreToolUse fires before any permission-mode check. Searched hooks-guide, hooks, permissions, permission-modes.
Source: https://code.claude.com/docs/en/hooks-guide
Source: https://code.claude.com/docs/en/hooks
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/sandboxing
Checked: 2026-10-21

## F14 Read-only commands, protected paths, critical paths, the working folder

- Read-only commands: "a built-in set of Bash commands" that run without a prompt in every mode: `ls`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, and read-only forms of `git`. Not configurable; add an `ask` or `deny` rule to require a prompt. In auto mode they can also wait for the classifier.
- Still prompt in Manual mode: unquoted globs for commands with write-capable flags (`find`, `sort`, `sed`, `git`); `docker` aimed at another daemon; `file -m`/`-f`; "`ps` that could print environment variables" (e.g. `ps auxe`, `ps aux -e`; dashed form check v2.1.290+), while `ps aux` and `ps -ef` don't prompt; Windows network (UNC) paths; writes to special shell variables like `PATH` or `IFS`; "Commands the analysis can't parse" (and anything over 10,000 characters); `cd` into a different directory combined with `git` (git can run that directory's hooks). A redirect like `ls > out.txt` adds a check on the target.
- Working folder is a prompt, not a wall (Security page): "In Manual mode, Claude Code asks you before its file tools read or write outside the folder where it was started and its subfolders. The boundary is a permission prompt, so a Bash command you approve can still write anywhere your user account can." Extend with `--add-dir`, `/add-dir`, or `additionalDirectories`; for OS-level limits, the sandbox.
- Protected paths: "Writes to a small set of paths are never auto-approved, except in `bypassPermissions` mode" (and plan mode in interactive terminal sessions with bypass available). Per mode: `default`/`acceptEdits` prompted; `auto` routed to the classifier; `dontAsk` denied; `bypassPermissions` allowed. `permissions.allow` rules don't pre-approve them (e.g. `Edit(.claude/**)` changes nothing).
- Protected directories: `.git`, `.config/git`, `.vscode`, `.idea`, `.husky`, `.cargo`, `.devcontainer`, `.yarn`, `.mvn`, `.claude` (with exceptions such as `.claude/worktrees/`, the session's plan files, and Markdown files in the auto memory directory), a `--plugin-dir` directory, `~/.claude/dev-mods/`.
- Protected files: `.gitconfig`, `.gitmodules`; shell profiles `.bashrc`, `.bash_profile`, `.bash_login`, `.bash_aliases`, `.bash_logout`, `.zshrc`, `.zprofile`, `.zshenv`, `.zlogin`, `.zlogout`, `.profile`, `.envrc`; `.npmrc`, `.yarnrc`, `.yarnrc.yml`, `.pnp.cjs`, `.pnp.loader.mjs`, `.pnpmfile.cjs`, `bunfig.toml`, `.bunfig.toml`; `.bazelrc`, `.bazelversion`, `.bazeliskrc`; `.pre-commit-config.yaml`, `lefthook.yml`/`.yaml` (and dotted forms); `gradle-wrapper.properties`, `maven-wrapper.properties`; `.devcontainer.json`; `.ripgreprc`, `pyrightconfig.json`; `.mcp.json`, `.claude.json`; and the target of a symlinked settings file.
- Critical paths: "the directories Claude Code protects from `rm` and `rmdir` commands, such as the filesystem root, your home directory, and your working directory." Also top-level directories (`/usr`, `/etc`, …), the working directory's parents, Windows drive roots, and forms like `rm -rf "$DIR"/*` that become root removals when a variable is empty. "Claude Code never lets a `permissions.allow` rule or a `PreToolUse` hook that returns `"allow"` approve an `rm` or `rmdir` command that targets a critical path, even in modes that skip other prompts." A deny rule still blocks it. Per mode: `default`/`acceptEdits`/`plan` ask; `auto` asks in the terminal with a time limit, denies elsewhere; `dontAsk` denies; `bypassPermissions` asks (time limit in the terminal).
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/security
Checked: 2026-10-21

## F15 Workspace trust

- In an interactive session, Claude Code shows the workspace trust dialog when you start it in a folder you haven't trusted. "The dialog lists the rules and directories the folder would grant so you can review them first." Project `.mcp.json` servers have their own approval prompt.
- `permissions.allow` rules and `additionalDirectories` in a project's `.claude/settings.json` apply only after you accept the dialog; `deny` and `ask` rules aren't affected, "since they only restrict."
- In an interactive session, Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the dialog for the folder or a parent whose trust extends to it.
- Where trust is stored/keyed: in a repository, on the git repository root (worktrees: main checkout); outside a repository, on the start directory, covering its subdirectories. Recorded in `~/.claude.json` as `projects["<path>"].hasTrustDialogAccepted`.
- Home folder: "When you start Claude Code directly in your home directory, trust acceptance is held for the current session only and is not written to disk, so the prompt reappears on each launch. There is no setting to persist it. Start Claude Code from a project subdirectory instead, where trust acceptance is saved per directory."
- `claude -p` and SDK sessions never show the trust dialog (nor the `.mcp.json` prompt); a `-p` session treats the folder as trusted for hooks.
- "What runs before you trust a folder" (permissions#what-runs-before-you-trust-a-folder), the full table. "The columns are the two situations in which you haven't trusted the folder itself: you trusted only a parent folder, or you ran `claude -p` or the SDK there, which never shows the trust dialog."

| What the repository supplies | You trusted only a parent folder | `claude -p` or the SDK, folder never trusted |
|---|---|---|
| Hooks in settings files, the `env` block and helper commands such as `apiKeyHelper`, and a project skill's hooks and `allowed-tools` | Used | Used. "Workspace trust never gates a skill's `allowed-tools` in any session" |
| `permissions.allow` rules and `additionalDirectories` in `.claude/settings.json` | Not used until you accept the trust dialog, which appears again listing them | Not used. Claude Code prints a `this workspace has not been trusted` warning to stderr |
| Frontmatter hooks in a project subagent, a project `@skills-dir` plugin, and `extraKnownMarketplaces` entries from the repository or an `--add-dir` directory | Not used, and no dialog is offered | Not used |
| Inline `mcpServers` in the frontmatter of a subagent from the repository or an `--add-dir` directory | Not used, and no dialog is offered | Not used |
| Servers in `.mcp.json`, including ones the repository approves in its own settings | Claude Code asks you before connecting them. The repository's own approvals don't count | Connected without asking, approved or not. The SDK loads them only when `settingSources` includes project settings. `claude mcp list` in the same folder still reports such a server as pending |
| A `headersHelper` on a server in `.mcp.json` | Not run until you accept the trust dialog, which appears again naming where the helper is declared; the server connects with its static `headers` alone until then | Not run; the server connects with its static `headers` alone and a `headersHelper not run` line per server goes to stderr |

- Nested repositories: "The parent-folder column doesn't apply inside a nested repository: in an interactive session Claude Code shows the trust dialog for it, and a `claude -p` or SDK run there follows the `claude -p` column." Outside a repository, trust "covers any subdirectory of that directory apart from a git repository nested inside it, such as a clone. Each covered subdirectory then counts as a folder whose parent you trusted." So the parent-folder column is about a non-git subfolder (e.g. an unpacked download) inside a folder you trusted; a `git clone` inside it gets its own trust dialog.
- Trust a folder by hand: set `projects["<path>"].hasTrustDialogAccepted` to `true` in `~/.claude.json`.
- "Before you run `claude -p` in a repository you didn't write, decide what it may run on your machine" (permissions#what-runs-before-you-trust-a-folder):
  - "Pass `--setting-sources user`, or set the SDK's `settingSources` without project settings, so Claude Code reads neither the project's settings files nor its `.mcp.json`". (`--setting-sources`: "Comma-separated list of setting sources to load (`user`, `project`, `local`)", cli-reference.)
  - "Start with `--bare` so Claude Code reads no hooks, skills, custom commands, subagents, plugins, or `.mcp.json` servers from the project. The project's `env` block and helpers such as `awsAuthRefresh` in its settings files still apply, and Claude Code reads `apiKeyHelper` only from `--settings`".
  - "Pass `--settings '{"disableAllHooks": true}'` to turn hooks off for that run. Setting it in your user settings alone isn't enough, because the repository's project settings take precedence over yours and can set it back to `false`".
  - "Add a `disabledMcpjsonServers` entry to reject a `.mcp.json` server by name in every session type".
- `--bare` details (headless#start-faster-with-bare-mode): skips "auto-discovery of hooks, skills, custom commands, subagents, installed plugins, MCP servers, auto memory, and CLAUDE.md"; "Without `--bare`, a `-p` session runs the hooks in a project's `.claude/settings.json` and connects the servers in its `.mcp.json`, even in a folder you've never trusted. A `-p` session shows no workspace trust dialog and no per-server approval prompt." Bare mode "doesn't use your subscription login": "Claude Code never reads OAuth credentials or the system keychain"; set `ANTHROPIC_API_KEY` or an `apiKeyHelper` in `--settings`. In bare mode Claude has Bash, file read and file edit tools. "`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release."
- Other project limits: a project or local settings file can't make `defaultMode` `auto` or `bypassPermissions` (F11), and can't turn on Claude in Chrome (F8). Chrome: a project's `env` block setting `CLAUDE_CODE_ENABLE_CFC` to `1` is ignored with the warning `Claude Code ignored CLAUDE_CODE_ENABLE_CFC in this project's settings: a project can't turn on Claude in Chrome. To turn it on yourself, run /chrome or start with --chrome.` ("a repository you check out must not be able to connect Claude to your browser", chrome#project-settings-cant-turn-on-chrome).
- Security page best practices for untrusted content include "Use virtual machines (VMs) to run scripts and make tool calls, especially when interacting with external web services". Sandbox environments page, "Choose an approach": "Work on an untrusted repository" → "A dedicated virtual machine, or a cloud session if you have a Claude subscription". A VM is for "when you are evaluating untrusted code"; a cloud session "runs in an isolated, Anthropic-managed virtual machine". The built-in sandboxed Bash tool restricts only Bash (and PowerShell, Monitor) commands: "Built-in file tools, MCP servers, and hooks still run directly on your host."
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/security
Source: https://code.claude.com/docs/en/hooks
Source: https://code.claude.com/docs/en/settings
Source: https://code.claude.com/docs/en/chrome
Source: https://code.claude.com/docs/en/headless
Source: https://code.claude.com/docs/en/cli-reference
Source: https://code.claude.com/docs/en/sandbox-environments
Checked: 2026-10-22 (table and `-p` guidance re-read in full; first checked 2026-10-21)

## F16 Auto mode, in more detail (extends F4)

- Docs warning: "Auto mode reduces permission prompts but does not guarantee safety. Use it for tasks where you trust the general direction, not as a replacement for review on sensitive operations."
- Boundaries stated in chat: "If you tell Claude "don't push" or "wait until I review before deploying", the classifier blocks matching actions even when the default rules would allow them." A boundary stays until you lift it; "Claude's own judgment that a condition was met does not lift it." But "Boundaries are not stored as rules. The classifier re-reads them from the transcript on each check, so a boundary can be lost if context compaction removes the message that stated it. For a hard guarantee, add a deny rule instead."
- Approvals stated in chat: telling Claude a blocked action is allowed can clear the block, but "your message has to name the action and the specific thing that makes it dangerous, such as the branch of a force push. Naming the verb alone clears nothing, so "you can force-push" leaves the block in place." An approval covers the one action you named; some blocks stay regardless.
- A blocked action: Claude Code shows a notification and lists it in `/permissions` under the **Recently denied** tab, "where you can press `r` to retry it with a manual approval" (on exiting the dialog Claude Code tells the model it may retry). The on-screen notice looks like `bash denied by auto mode · [Data Exfiltration] · /permissions`. 3 blocks in a row or 20 in total pause auto mode (not configurable); approving the prompted action resumes it.
- Broad allow rules dropped on entering auto mode: blanket `Bash(*)` / `PowerShell(*)`; wildcarded interpreters like `Bash(python*)`; package-manager run commands; `Agent` allow rules; `Monitor` allow rules (since v2.1.236). "Narrow rules like `Bash(npm test)` stay in effect. Claude Code restores the dropped rules when you leave auto mode."
- Decision order: allow/ask/deny rules first (content-matching ask rules like `Bash(git push *)` fall back to a prompt; protected-path writes go to the classifier; no allow rule approves critical-path `rm`); then reads and working-directory edits are auto-approved (except protected paths and the first outside read); everything else goes to the classifier.
- What the classifier sees: user messages, tool calls other than read-only lookups, and CLAUDE.md; tool results are stripped "so hostile content in a file or web page can't manipulate the classifier directly." (Scoped in the docs to "the classifier requests sent by Claude Code itself"; the docs don't say what server-side classifier review sees.) An instruction in CLAUDE.md "steers both Claude and the classifier" (auto-mode-config#where-the-classifier-reads-configuration), but it isn't an enforced rule. A separate server-side probe scans incoming tool results and flags suspicious content.
- First read outside the working folders: in auto mode, file reads outside the working directories otherwise run without a prompt, but "The first time Claude uses the Read, Grep, or Glob tool on a path outside them, Claude Code asks whether to allow that read." Four options: **Yes, and keep allowing any reads outside the working directories** (recorded, no more prompt) / **No, and block reads outside the working directories from now on** (sets `permissions.blockReadsOutsideWorkingDirectories: true` in user settings, refusing such reads in every later session and mode) / **No, and ask again next time** / **Yes, but ask again next time**. Not shown in `-p` runs or background sessions.
- Subagents: "The classifier checks subagent work at three points": (1) before it starts, the delegated task description (blocked at spawn time if dangerous-looking); (2) each action while it runs, same decision order and rules (a subagent's `permissionMode` frontmatter is ignored); (3) when it finishes, its work and final report before the parent reads it. A flagged report is still delivered with a security warning prepended.
- With the sandbox on (v2.1.271+): sandboxed commands get no network by default; "Claude names the hosts a command needs on the command itself, the classifier reviews them with the command, and an approved list opens those hosts for that one command alone." Nothing is added to session or settings; `deniedDomains` still block; a host no approved command listed is refused without a prompt.
- Pushing to any branch of the current repository runs without a prompt unless it falls under the block list; to keep a human checkpoint, add `permissions.ask` rules.
- `defaultMode: "auto"` doesn't take effect from `.claude/settings.json` or `.claude/settings.local.json`; put it in `~/.claude/settings.json`.
- `claude auto-mode defaults` prints the full default block/allow rule lists as JSON.
- How firm each boundary is (auto-mode-config#common-boundaries table): `permissions.ask` "Always prompts for a command that matches a content-scoped rule"; "The classifier cannot auto-approve a matching action." `permissions.deny` "Blocks before the classifier is consulted. Neither the classifier nor user intent can override it." A boundary stated in conversation: "The classifier blocks matching actions, but the boundary can be lost if context compaction removes the message that stated it. Use an ask or deny rule for a durable guarantee." The docs' checkpoint recipe: `"ask": ["Bash(git push *)", "Bash(gh pr create *)"]`; these match commands as written, so `git -C <dir> push` isn't checkpointed. (checked 2026-10-22.)
- Critical-path `rm` in auto mode: "By default, the classifier doesn't review recognized `rm` and `rmdir` critical-path removals, such as `rm -rf /` or `rm -rf ~`." In the terminal Claude Code asks you, with "a two-minute countdown"; if it runs out, "Claude Code denies the command and tells Claude what to do instead"; pressing any key stops the countdown. Where no terminal prompt can be shown (`-p`, the Agent SDK, VS Code's chat panel, the Desktop app) it denies immediately. A matching ask rule asks without a time limit. (permission-modes#critical-path-removals-in-each-permission-mode, #time-limits-and-denials-in-auto-and-bypasspermissions-modes; checked 2026-10-22.)
- Changing Claude's own permission config is a default block: the auto-mode-config page lists the built-in `soft_deny` rules as "including force push, `curl | bash`, production deploys, and auto-mode bypass" (#override-the-block-and-allow-rules); the engineering post's "Degrade security posture" group includes "modifying the agent's own permission config"; and `claude auto-mode defaults` (CLI 2.1.306) prints a `soft_deny` rule labeled `Self-Modification`: "Edits to the agent's own config that (a) add or widen permissions or weaken guards — permission allow rules (e.g. wildcard `"Bash(prefix:*)"` entries), hook or sandbox changes, approval-gate settings — that the user did not explicitly ask for". `soft_deny` rules are "destructive actions that user intent can clear". Source: https://code.claude.com/docs/en/auto-mode-config; https://www.anthropic.com/engineering/claude-code-auto-mode; `claude auto-mode defaults`. Checked 2026-10-22.
- Recently denied lists classifier denials only: when the classifier gives no verdict, Claude Code "denies the action without recording it under **Recently denied**" (auto-mode-config#review-denials). Some blocks can't be cleared by an approval in chat: "To run a step it won't clear, leave auto mode and answer the permission prompt" (permission-modes#approvals-you-state-in-conversation). Checked 2026-10-22.
- Recently denied: "highlight a denied Bash or PowerShell action to read its command below the list." For a one-off action you did intend, the docs' fix is to "state that intent in your next message and let Claude retry." (auto-mode-config#review-denials; checked 2026-10-22.)
- The classifier "trusts your working directory and the remotes that were configured for it when the session started"; everything else is external until configured. Pushing to a non-default branch named like a deploy target (`production`, `gh-pages`) isn't covered by the push default. (permission-modes#what-the-classifier-blocks-by-default; checked 2026-10-22.)
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/auto-mode-config
Source: https://code.claude.com/docs/en/sandboxing
Checked: 2026-10-21

## F17 Sessions, files on disk, checkpoints, context and memory

- Sessions on disk: "Each message, tool use, and result is written to a plaintext JSONL file under `~/.claude/projects/`", at `~/.claude/projects/<project>/<session-id>.jsonl` (`<project>` = working directory path with non-alphanumeric characters replaced by `-`). Subagent transcripts sit under `projects/<project>/<session>/subagents/`.
- "Transcripts and history are not encrypted at rest. OS file permissions are the only protection. If a tool reads a `.env` file or a command prints a credential, that value is written to `projects/<project>/<session>.jsonl`." Typed prompts go to `~/.claude/history.jsonl`.
- Retention: deleted after `cleanupPeriodDays` (default 30 days, minimum 1). Auto memory files aren't swept. Desktop/Cowork transcripts are kept at any age unless `desktopSessionCleanupPeriodDays` is set (v2.1.248+).
- `~/.claude/`: your user `settings.json`, `CLAUDE.md`, skills, agents, auto memory (`projects/<project>/memory/`), transcripts, plugins. `~/.claude.json`: "App state, OAuth, UI toggles, personal MCP servers"; per-project entries hold trust, history and MCP servers. Docs: "Don't delete `~/.claude.json`, `~/.claude/settings.json`, or `~/.claude/plugins/`: those hold your auth, preferences, and installed plugins."
- Application data (claude-directory#application-data): "These files are plaintext. Anything that passes through a tool is written to a transcript on disk: file contents, command output, pasted text." `claude purge` deletes the state Claude Code holds for one project: transcripts and auto memory under `projects/`, per-session `tasks/`, `debug/`, `file-history/` entries, matching lines in `history.jsonl`, and the project's entry in `~/.claude.json` (not pasted images or the scratchpad, which live under the temp directory). Plaintext-storage mitigations listed: lower `cleanupPeriodDays`, set `desktopSessionCleanupPeriodDays`, `CLAUDE_CODE_SKIP_PROMPT_HISTORY`, permission rules denying reads of credential files. (Checked 2026-10-22.)
- Project `.claude/` (committed unless noted): `settings.json` (permissions, hooks, env vars), `settings.local.json` (personal, not committed), `skills/<name>/SKILL.md`, `commands/`, `agents/`, `rules/`; plus `.mcp.json` (team-shared MCP servers) and `CLAUDE.md` at project level.
- Sessions are independent: "Each new session starts with a fresh context window." `claude --continue` / `claude --resume` reopen a session under the same ID; `--fork-session` or `/branch` copy it.
- Interrupt: `Esc` stops Claude immediately (running tool call canceled); typing a message and `Enter` queues it, read as soon as the current tool calls finish.
- Checkpoints: "Before Claude edits a file, it snapshots the current contents. If something goes wrong, press `Esc` twice to rewind to a previous state, or ask Claude to undo." `/rewind` (or `Esc` twice with an empty prompt) opens the menu (Restore code and conversation / Restore conversation / Restore code / Summarize… / Never mind). A checkpoint per prompt that starts a turn; snapshots for the 100 most recent; kept with the conversation for resumed sessions.
- Checkpoint limits: "They only cover file changes." Files changed by Bash commands (`rm`, `mv`, `cp`) aren't tracked; most subagent edits aren't restored; external edits aren't tracked; symlinked/hard-linked files are skipped. "Actions that affect remote systems (databases, APIs, deployments) can't be checkpointed." Not a replacement for git.
- Context window holds "your conversation history, file contents, command outputs, CLAUDE.md, auto memory, loaded skills, and system instructions." "Run `/context` to see what's using space."
- Compaction: "It clears older tool outputs first, then summarizes the conversation if needed. Your requests and key code snippets are preserved; detailed instructions from early in the conversation may be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history." Project-root CLAUDE.md is re-read after `/compact` (F6). `/compact <focus>` or a "Compact Instructions" section in CLAUDE.md steer it.
- `/memory`: lists CLAUDE.md, CLAUDE.local.md and other memory files across user and project scopes, toggles auto memory on/off (saves `autoMemoryEnabled` to `~/.claude/settings.json`), and opens the auto memory folder. Auto memory files are plain markdown you can edit or delete.
- What survives compaction (context-window#what-survives-compaction): project-root CLAUDE.md and unscoped rules, and auto memory, are re-injected from disk; nested CLAUDE.md and path-scoped rules reload on demand; up to five recently read/edited files are re-read; instructions given only in conversation are summarized with everything else. (Checked 2026-10-22.)
- Desktop app: "type `/context` in the prompt box to print a per-category breakdown of this session's context window in the chat"; the session details panel's **Context** card (current layout) or the usage ring next to the model picker (earlier layout) shows how full it is. Desktop and CLI share CLAUDE.md and CLAUDE.local.md. (desktop#check-usage, desktop#shared-configuration; checked 2026-10-22.)
- Desktop terminal-dialog commands (desktop#whats-not-available-in-desktop): "built-in commands that open an interactive panel in the terminal behave differently in the Code tab. Edit settings files directly … or run the commands from the standalone CLI." "Commands with no argument form, such as `/permissions`, reply with `isn't available in this environment`." (Checked 2026-10-22.)
- UNVERIFIED: `/memory` in the desktop app. It isn't named on the desktop page, but it opens a terminal panel and has no argument form, so by the rule above it likely replies `isn't available in this environment`. Content tells learners to use a terminal session or open CLAUDE.md in an editor, and doesn't claim either way.
- `/init`: generates a starting CLAUDE.md from your codebase (build commands, test instructions, conventions); if one exists it suggests improvements instead of overwriting.
- Auto memory: `~/.claude/projects/<project>/memory/` (`<project>` derived from the git repository, so worktrees and subdirectories share one). "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation." Messages like "Saved 2 memories" / "Recalled 2 memories" show Claude using it. "When you ask Claude to remember something … Claude saves it to auto memory." To see what it saved: "Run `/memory` and select the auto memory folder to browse what Claude has saved. Everything is plain markdown you can read, edit, or delete." (memory#auto-memory, memory#i-dont-know-what-auto-memory-saved; checked 2026-10-22.)
Source: https://code.claude.com/docs/en/how-claude-code-works
Source: https://code.claude.com/docs/en/sessions
Source: https://code.claude.com/docs/en/claude-directory
Source: https://code.claude.com/docs/en/checkpointing
Source: https://code.claude.com/docs/en/memory
Source: https://code.claude.com/docs/en/context-window
Source: https://code.claude.com/docs/en/desktop
Checked: 2026-10-21

## F18 Prompt-injection safeguards (Security page)

- Definition (docs): "Prompt injection is a technique where an attacker attempts to override or manipulate an AI assistant's instructions by inserting malicious text."
- Permission system: in Manual mode, sensitive operations require explicit approval.
- Network command approval: "Commands that fetch content from the web such as `curl` and `wget` are not auto-approved by default." You can still approve once or add an explicit allow rule like `Bash(curl *)`; in auto mode the classifier decides them. In Manual mode they prompt like any other non-read-only Bash command; add them to `permissions.deny` to stop them (a deny matches the command as written; for enforcement, sandbox network isolation).
- Network request approval: in Manual mode, most tools that make network requests require approval by default.
- Web page summaries: "For most fetches, WebFetch runs a separate model call over the page, and Claude receives that call's answer instead of the raw page." The tools reference calls WebFetch "lossy by design"; `curl` via Bash gets the unprocessed page.
- Trust verification: the workspace trust dialog for a folder you haven't trusted, and a separate approval prompt for a project's `.mcp.json` servers. A `-p` session shows neither (F15).
- Command injection detection: "In Manual mode, Claude Code asks before running a Bash command it can't fully analyze. An allow rule for part of a command, such as `Bash(git *)`, doesn't skip that prompt." Sandboxed commands can run without it.
- Fail-closed matching: in Manual mode, unmatched commands require approval by default.
- Subagent output scanning (Subagents page): "Claude Code scans each subagent's final report before Claude reads it." It inserts a backslash into text imitating Claude Code's own output (e.g. a `<system-reminder>` tag, lines starting `Human:` / `Assistant:`), and prepends a marker line starting `[harness: subagent output matched instruction-shaped pattern(s):` for such imitations or mentions of permission settings like `bypassPermissions`. "The scan doesn't judge whether content is malicious"; tool calls a report leads to still go through permission checks and sandboxing. Reports arrive under a header stating that instructions or approval claims inside are the subagent's words and "carry no authority from you". In auto mode the classifier also reviews the report (F16).
- Best practices for untrusted content: review suggested commands before approval; avoid piping untrusted content directly to Claude; verify proposed changes to critical files; use VMs for scripts and tool calls, especially with external web services; "Report suspicious behavior with `/feedback`".
- Docs warning: "While these protections significantly reduce risk, no system is completely immune to all attacks. Always maintain good security practices when working with any AI tool."
- MCP: Anthropic reviews connectors against listing criteria but "does not security-audit or manage any MCP server."
- What other tools pass to Claude (tools-reference#webfetch-tool-behavior, mcp, chrome; checked 2026-10-22): the separate summary call is documented only for WebFetch ("lossy by design"; "use `curl` via Bash for the unprocessed page"). MCP docs warning: "Verify you trust each server before connecting it. Servers that fetch external content can expose you to prompt injection risk." MCP tool output reaches the conversation (the docs say nothing about summarizing it either way): Claude Code warns above 10,000 tokens, and a result over the limit is saved to a file and replaced "in the conversation with a message that names the file path, so Claude reads the file when it needs the content" (mcp#mcp-output-limits-and-warnings). Claude in Chrome reads pages directly: "read console errors and DOM state directly"; "Claude navigates to the page, reads the content". Content says the docs describe a summary step only for WebFetch, and that these tools give Claude what they return; it doesn't claim any particular server includes or strips hidden text, which depends on the server.
Source: https://code.claude.com/docs/en/security
Source: https://code.claude.com/docs/en/tools-reference
Source: https://code.claude.com/docs/en/sub-agents
Source: https://code.claude.com/docs/en/mcp
Source: https://code.claude.com/docs/en/chrome
Checked: 2026-10-21

## F19 Your powers: root/sudo and bypass, environment variables, protecting credentials

- Claude runs with your powers: "a Bash command you approve can still write anywhere your user account can" (security, working directory boundary). Hooks, local MCP servers, plugin monitors and helper commands "run with your full access" (sandboxing). Credentials Claude Code itself stores: macOS Keychain when available; on Linux "a file with mode `0600`" (security).
- Root/sudo refusal: "On Linux and macOS, Claude Code refuses to start in `bypassPermissions` mode when running as root or under `sudo`", with the message `--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons`. Exception: "The check is skipped automatically inside a recognized sandbox." The docs' advice for autonomous runs in a container: the dev container configuration, "which runs Claude Code as a non-root user". The devcontainer page: "The CLI rejects this flag when launched as root, so confirm `remoteUser` is set to a non-root account." (permission-modes#skip-all-checks-with-bypasspermissions-mode; devcontainer.)
- UNVERIFIED: what counts as a "recognized sandbox", and whether the refusal applies on Windows. The docs don't list either; content doesn't state them.
- Environment variables in the sandbox: the sandboxing access table says sandboxed commands' environment variables are "Inherited from Claude Code, including any secrets in its environment", changed with `credentials` or `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` (extends F10).
- `sandbox.credentials` (sandboxing#protect-credentials): "declares credential files and environment variables to protect from sandboxed commands." Entries go under `files` (`path`) and `envVars` (`name`), each with a `mode`. With `"mode": "deny"`, "file paths are denied for reads inside the sandbox ... and environment variables are unset before each sandboxed command runs." Docs example: `"envVars": [{ "name": "GITHUB_TOKEN", "mode": "deny" }, { "name": "NPM_TOKEN", "mode": "deny" }]` and `"files": [{ "path": "~/.aws/credentials", "mode": "deny" }, { "path": "~/.ssh", "mode": "deny" }]`. "There is no built-in credential deny list, so only the files and variables you list are restricted." "`sandbox.credentials` affects sandboxed Bash commands only." "Claude Code merges the `deny` entries from every settings scope the session loads. A `deny` entry only ever narrows access, so any scope can add one, but no scope can remove one that another scope added." (When you exclude project or local settings as a source, their `credentials` entries aren't applied, v2.1.246+.) The environment-variable protection still applies if filesystem isolation is turned off; the file protection doesn't. A `"mode": "mask"` alternative shows commands a placeholder (the sentinel) and the proxy substitutes the real value on requests to allowed hosts; honored only from user/managed settings or `--settings`.
- Outside the sandbox: `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips credentials "from the environments of the subprocesses Claude Code starts, such as Bash commands, hooks, and stdio MCP servers. This reduces what a prompt injection attack can read." It recognizes credentials by name or value shape (removes e.g. `ANTHROPIC_API_KEY`, `AWS_SECRET_ACCESS_KEY`, `NPM_TOKEN`, `DB_PASSWORD`) but leaves GitHub tokens (`GITHUB_TOKEN`, `GH_TOKEN`) and `HTTP_PROXY`/`HTTPS_PROXY` in place. Docs: use it "as one layer alongside narrow permission rules rather than as the only control." (env-vars#what-the-subprocess-environment-scrub-removes.) So, without the scrub, the Bash commands Claude runs see the variables in Claude Code's environment (implied by the scrub's description, not stated outright; content says commands started from your terminal "get a copy").
- Settings `env` block: Claude Code copies `env` entries into its environment; "In a settings file you can set a variable but you can't remove one." "Subprocesses still inherit the empty value." (env-vars#set-environment-variables.)
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/devcontainer
Source: https://code.claude.com/docs/en/sandboxing
Source: https://code.claude.com/docs/en/env-vars
Source: https://code.claude.com/docs/en/security
Checked: 2026-10-22

## F20 MCP servers: scopes, commands, logins, approvals, connectors, output limits, risks

- What they are: MCP servers give Claude Code tools beyond its built-in set; they "run on your machine or as hosted services" (mcp-quickstart). Local **stdio** servers: "Stdio servers run as local processes on your machine"; "a program Claude Code starts as a subprocess on your machine, rather than a service it reaches over a URL" (added with `claude mcp add <name> -- <command> [args...]`; no `--transport` flag needed, stdio is the default). Remote **HTTP** servers: "HTTP servers are the recommended option for connecting to remote MCP servers" (`claude mcp add --transport http <name> <url>`); SSE is deprecated. Hosted services like Sentry, Linear and Notion "run their MCP servers behind OAuth: you add the server's URL, then sign in through your browser." Local servers run with your full access (F19).
- `claude mcp add` confirms with a line like `Added HTTP MCP server claude-code-docs with URL: https://code.claude.com/docs/mcp to local config` (stdio: `Added stdio MCP server playwright with command: npx -y @playwright/mcp@latest to local config`), followed by a `File modified:` line naming the file it wrote. `Added` "means the configuration was written", not that the server works.
- Scopes (mcp#mcp-installation-scopes; mcp-quickstart#find-your-configuration-on-disk), set with `--scope`:
  | Scope | Stored in | Loads in / shared |
  | - | - | - |
  | `local` (the default) | `~/.claude.json`, under the entry for this project | only you, only this project |
  | `project` | `.mcp.json` in the project root | everyone who clones the project ("Check `.mcp.json` into version control") |
  | `user` | `~/.claude.json`, under the top-level `mcpServers` key | only you, all your projects |
  MCP "local scope" is not `.claude/settings.local.json`. Same name in several scopes: local beats project beats user, then plugin servers, then claude.ai connectors; the whole entry from the winner is used. "A server's scope is fixed when you add it": to change it, remove and re-add.
- Managing (mcp#managing-your-servers): `claude mcp list` (all configured servers, each with a health status), `claude mcp get <name>` (details, including which scope holds it), `claude mcp remove <name>` (confirms `Removed MCP server "<name>" from local config` plus a `File modified:` line; `--scope <scope>` picks one definition), and `/mcp` inside a session to check and manage servers. Run `claude mcp add` "in your terminal, not inside a `claude` session". Each connected server's tool names and server instructions take context space in every session; "Removing servers you no longer use keeps that space free."
- Statuses: `✔ Connected`, `! Connected · tools fetch failed`, `! Needs authentication`, `✘ Failed to connect`, `✘ Connection error`, ``⏸ Pending approval (run `claude` to approve)`` (a project-scoped server you haven't approved), `⊘ Disabled for this project (re-enable via /mcp)`; `claude mcp get` can also show `✘ Rejected (see disabledMcpjsonServers in settings)`.
- UNVERIFIED: the exact column layout of a `claude mcp list` line (name, URL or command, status). Docs give the status strings but not the line format; content shows the statuses and an illustrative layout.
- `/mcp` panel: lists servers with a tool count; selecting a server opens its menu. Labels the docs name: `Authenticate` (quickstart: select the server, press Enter, choose `Authenticate`, and the browser opens to sign in), **Re-authenticate**, **Clear authentication**, **Disable**, **Reconnect**, **View tools** (F8). Toggling a server off "stop[s] Claude Code from connecting to it without losing its configuration"; the choice is saved per project in `~/.claude.json` (`disabledMcpServers`). `/mcp` → select a tool shows its full name (F9).
- UNVERIFIED: the full list and order of items in a server's `/mcp` menu. Content names only the labels above, never a complete menu.
- OAuth (mcp#authenticate-with-remote-mcp-servers): "Claude Code supports OAuth 2.0"; "Authentication tokens are stored securely and refreshed automatically"; "Use "Clear authentication" in the `/mcp` menu to revoke access"; "OAuth authentication works with HTTP servers". From the shell: `claude mcp login <name>`, and `claude mcp logout <name>` "to clear stored credentials". "When you remove a remote server, Claude Code also deletes the OAuth tokens and client registration it stored for that server." A `claude -p` run can't run the OAuth flow; sign in from an interactive session first.
- Project `.mcp.json` approval (mcp#project-scope): "For security reasons, Claude Code prompts for approval in interactive sessions before using project-scoped servers from `.mcp.json` files. To reset those approval choices, run `claude mcp reset-project-choices`." Quickstart: "The prompt exists so a repository you clone can't launch processes on your machine without your consent." "In `claude -p` runs, Agent SDK sessions, and cloud sessions outside a project's threads, Claude Code can't show that prompt: it loads project-scoped servers without asking." To keep one out anyway: `disabledMcpjsonServers` ("blocks it in every permission mode"), `--setting-sources`, or `--strict-mcp-config`. A cloned repository can't approve its own servers: `enableAllProjectMcpServers` / `enabledMcpjsonServers` committed to its `.claude/settings.json` are ignored in an untrusted folder (F15).
- UNVERIFIED: the exact wording and options of the `.mcp.json` approval prompt. Content says only that Claude Code asks before connecting.
- claude.ai connectors (mcp#use-mcp-servers-from-claude-ai): "If you've logged into Claude Code with a claude.ai account, MCP servers you've added in claude.ai, known as connectors, are automatically available in Claude Code." In `/mcp` they "appear in the list with indicators showing they come from claude.ai" (display names like `claude.ai Slack`). Fetched only when the active login is a claude.ai subscription (not with `ANTHROPIC_API_KEY`, a third-party provider, etc.). Turn one off for a project with the `/mcp` toggle, all of them with `disableClaudeAiConnectors: true` or `ENABLE_CLAUDEAI_MCP_SERVERS=false`. Their tools are named `mcp__claude_ai_<server>__<tool>` (F9).
- Desktop app (desktop#connect-external-tools): "Connectors are MCP servers with a graphical setup flow." Add them with **+** next to the prompt box → **Add connectors** (or **Connectors** → **Browse connectors**). "To manage or disconnect connectors, go to **Settings > Connectors** in the desktop app." Servers in `~/.claude.json` or `.mcp.json` work in both the CLI and the desktop app.
- Output limits (mcp#mcp-output-limits-and-warnings): "Claude Code displays a warning when any MCP tool output exceeds 10,000 tokens"; "the default maximum is 25,000 tokens", adjustable with `MAX_MCP_OUTPUT_TOKENS`. Over the limit, a successful text result is saved to a file in the session's `tool-results` directory and replaced "in the conversation with a message that names the file path, so Claude reads the file when it needs the content." (Tools may declare their own limit with `anthropic/maxResultSizeChars`; text results over 50,000 characters are also saved to a file.)
- Permission rules for MCP tools (permissions#mcp, F9, F12): `mcp__<server>__<tool>` for one tool, `mcp__<server>__*` (or `mcp__<server>`) for all of a server's tools.
- Risk facts the docs state: "Verify you trust each server before connecting it. Servers that fetch external content can expose you to prompt injection risk." Security page: "We encourage either writing your own MCP servers or using MCP servers from providers that you trust"; "Anthropic reviews connectors against its listing criteria before adding them to the Anthropic Directory, but does not security-audit or manage any MCP server." Reviewing `.mcp.json` "doesn't show every server a session can load" (other scopes, connectors, plugins).
- Tool descriptions reach Claude: Claude Code cuts a tool description past 4,096 characters (upfront) or 16,384 (via tool search), "and Claude sees only the text before the cut" (mcp, description limits). So a description is text Claude reads.
- Servers can change while connected (mcp#dynamic-tool-updates): "An MCP server can change the tools, prompts, or resources it offers while connected and send a `list_changed` notification"; in an interactive session "Claude Code fetches the updated list from that server, so you don't need to reconnect it."
- UNVERIFIED: whether Claude Code shows you or re-asks about a changed tool description. The docs describe no such step; content says only that the list can change after you approved or connected the server, not that Claude Code never warns.
- Not stated in Claude Code docs (general MCP risks the course teaches as such, without claiming a Claude Code behavior): "poisoned" tool descriptions (orders hidden in a description), and cross-server injection (text from one server's result, or one server's description, steering Claude to call another server's tool). Content frames these as "a description is text Claude reads" and "one server's output can push Claude toward another server's tools", consistent with the prompt-injection warning above.
- Prompt look for MCP tool calls: see F1 (option-2 wording UNVERIFIED; the course reuses the units 3–5 wording `Yes, and don't ask again for this tool`). MCP tool prompts never offer `Yes, and switch to auto mode` (Bash only, F1).
Source: https://code.claude.com/docs/en/mcp
Source: https://code.claude.com/docs/en/mcp-quickstart
Source: https://code.claude.com/docs/en/security
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/desktop
Checked: 2026-10-22

## F21 Skills: where they live, how they load, what they can switch on

- What they are: a skill is a `SKILL.md` file of instructions (YAML frontmatter between `---` lines, then Markdown). "Custom commands have been merged into skills": `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`.
- Where they live (skills#choose-where-skills-load): Personal `~/.claude/skills/<skill-name>/SKILL.md` ("All your projects on this machine"); Project `.claude/skills/<skill-name>/SKILL.md` ("Sessions in this repository … Commit it so your team gets it too"); Plugin `<plugin>/skills/<skill-name>/SKILL.md` ("Wherever the plugin is enabled, as `/plugin-name:skill-name`"). Also Enterprise (managed settings directory), nested, `--add-dir`, and claude.ai account. Same name: enterprise over personal, personal over project.
- How they load: "By default, both you and Claude can invoke any skill. You can type `/skill-name` to invoke it directly, and Claude can load it automatically when relevant to your conversation." The `description` is what "Claude uses … to decide when to apply the skill". In a regular session the descriptions are in context; the full skill loads when invoked.
- `disable-model-invocation: true`: "Claude can't invoke the skill on its own. Use this for workflows with side effects or that you want to control timing, like `/commit`, `/deploy`, or `/send-slack-message`. You don't want Claude deciding to deploy because your code looks ready." Its description is then not in context; you can still run it with `/name`. "If Claude tries anyway, Claude Code blocks the call … so expect Claude to suggest running `/deploy` yourself." (`user-invocable: false` is the opposite: only Claude can invoke it.)
- `allowed-tools`: "grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting you for approval. The grant clears when you send your next message." It "does not restrict which tools are available". Accepts a space- or comma-separated string or a YAML list. Docs example: `allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *)`. Deny and ask rules still override `allowed-tools`.
- Trust: "Workspace trust doesn't gate this field. Claude Code applies a project skill's `allowed-tools` even in a `-p` run in a folder you've never trusted. A skill can grant itself broad tool access, so review the `allowed-tools` of skills checked into a repository before you run Claude Code there." (Also F15's table: a project skill's hooks and `allowed-tools` are used when you trusted only a parent folder, and in `-p`.) Managed `allowManagedPermissionRulesOnly` makes Claude Code ignore `allowed-tools` in project and personal skills (v2.1.282+).
- Dynamic context: "The `` !`<command>` `` syntax runs shell commands before the skill content is sent to Claude. The command output replaces the placeholder, so Claude receives actual data, not the command itself." Docs example: `` !`git diff HEAD` ``. Injected commands "never prompt for permission while the skill renders": each is checked against your permission rules; a deny match aborts the invocation (`Shell command permission check failed for pattern "..."`); outside auto mode, anything other than allow also aborts, unless `allowed-tools` pre-approves it. In auto mode, such a command doesn't abort: the skill loads with an instruction for Claude to run it, and that call goes through auto mode's checks. Not run for skills synced from claude.ai.
- Hooks: the `hooks` frontmatter field: "Hooks that Claude Code registers when the skill is invoked and keeps running for the rest of the session."
- Other fields: `disallowed-tools` removes tools while the skill is active; `context: fork` runs the skill in a subagent.
Source: https://code.claude.com/docs/en/skills
Source: https://code.claude.com/docs/en/hooks
Source: https://code.claude.com/docs/en/permissions
Checked: 2026-10-22

## F22 Plugins and marketplaces

- What a plugin is: "a directory of skills, agents, hooks, MCP servers, or other components that Claude Code installs and loads as one unit." Components also include a hooks module (a "mod"), LSP servers, monitors, a `bin/` directory and settings. "Most plugins come from a marketplace, which is a catalog that lists plugins and where to fetch each one." Plugin skills are namespaced, e.g. `/my-plugin:review` (features-overview). An enabled plugin "is part of every session": its MCP servers run alongside each session and "its hooks fire at their events"; "what the plugin runs, it runs as you."
- Security page opening line (quote): "A Claude Code plugin you install can execute arbitrary code on your machine with your user privileges."
- What an installed plugin can do (plugins/security#understand-what-a-plugin-can-do): hooks run as shell commands at lifecycle points; monitors "run as background shell commands that Claude Code starts on its own"; stdio MCP servers run as processes on your machine; "Claude Code adds each enabled plugin's `bin/` directory to the `PATH` of the Bash tool's shell"; skills, commands and agents "enter Claude's context as instructions"; updates: "when auto-update is on for the marketplace you installed a plugin from, Claude Code updates that plugin in the background, so the files you reviewed can change on disk."
- Outside the rules and sandbox: "Claude Code's permission rules and sandbox cover the tool calls Claude makes, not the code a plugin runs by itself"; "Claude Code runs hooks, monitors, MCP servers, LSP servers, and the processes a mod starts outside the sandbox." A call to a plugin's MCP tool, or a Bash command running an executable from its `bin/`, is a tool call, so permission rules apply.
- Installing also enables it, unless `defaultEnabled: false`.
- Marketplace names (plugins/security): "A marketplace's name tells you who publishes the catalog, not what each plugin in it does, so review a plugin before you install it whichever marketplace it comes from." Tiers: official (e.g. `claude-plugins-official`, `claude-code-marketplace`, `anthropic-plugins`, … 14 names), community (`claude-community`, `claude-plugins-community`, `healthcare`), third-party (every other). "Claude Code accepts the official and community names only for marketplaces sourced from `github.com/anthropics/` repositories, so a third-party marketplace can't present itself as an Anthropic one." A marketplace a coworker or your organization publishes is third-party. A reserved name from another source: Claude Code refuses to load it (`Marketplace is registered from an untrusted source`).
- Trust warning shown in the details pane: "Make sure you trust a plugin before installing, updating, or using it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended or that they won't change. …"
- Review before install (plugins/security#review-a-plugin-before-you-install): (1) `claude plugin marketplace list` prints each marketplace's source; (2) run `/plugin` and select the plugin: "The details pane shows a **Will install** section listing the plugin's commands, agents, skills, hooks, and MCP and LSP servers" (or `Components will be discovered at installation` / `Component summary not available for remote plugin`); (3) read the source (**Open homepage** / **View on GitHub**; "If the pane offers neither, open the marketplace repository you found in the first step. Find the plugin's directory there."): "The **Will install** section shows that a hook exists but not what it runs", so read `hooks/hooks.json` ("the command each hook runs"), `.mcp.json` ("each server's command or URL") and `bin/` ("every file in the directory"); (4) `claude --plugin-dir <plugin directory> plugin details <plugin name>` prints a `Component inventory`. "After you install a plugin, run `claude plugin details <plugin name>` in your shell to print the same `Component inventory` for the installed copy."
- Install flow (plugins/install): `/plugin install <plugin>@<marketplace>` in a session opens the details pane instead of installing; `/plugin` alone opens the **Discover** tab. Scope options: **Install for you (user scope)** (every project on this machine; `enabledPlugins` in `~/.claude/settings.json`), **Install for all collaborators on this repository (project scope)** (`.claude/settings.json`, which you commit; each collaborator still runs `claude plugin install <name>@<marketplace> --scope project` once), **Install for you, in this repo only (local scope)** (`.claude/settings.local.json`). Local overrides project overrides user. `claude plugin install` from the shell defaults to user scope. Desktop app: **+** next to the prompt box → **Add plugins** (or **Plugins** → **Browse plugins**), select the plugin, choose a scope (user, project, or local-only); **Manage plugins** enables, disables or uninstalls.
- UNVERIFIED: the exact layout of the `/plugin` details pane and its **Will install** rows (the docs list what the section names, not how each row reads); content shows an illustrative layout.
- UNVERIFIED: whether the desktop plugin browser shows the **Will install** section. The desktop and plugins/install pages describe only selecting a plugin and choosing a scope there.
- Auto-update (plugins/install#keep-plugins-updated): "On by default: `claude-plugins-official` and the other official marketplace names except `knowledge-work-plugins` and `first-party-plugins`, plus marketplaces added from claude.ai." "Off by default: every other marketplace, including the community marketplace, third-party marketplaces, and local development marketplaces." Toggle per marketplace in `/plugin` → **Marketplaces** → **Enable auto-update** / **Disable auto-update**.
- Remove (plugins/security#remove-a-plugin-you-no-longer-trust): `claude plugin uninstall <plugin>` with the `--scope` you installed it at; cached files stay under `~/.claude/plugins/cache/` for 14 days; "if you don't trust the marketplace's owner either, remove the marketplace too, which uninstalls every plugin you installed from it" (`claude plugin marketplace remove <name>` or `/plugin marketplace remove <name>`).
- Plugin `hooks/hooks.json` shape: a top-level `"hooks"` key, same shape as the `hooks` object in `settings.json`, e.g. `"PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/format.sh\"" }] }]`. Plugin `.mcp.json`: `"mcpServers": { "db": { "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"] } }` (plugins/components).
Source: https://code.claude.com/docs/en/plugins
Source: https://code.claude.com/docs/en/plugins/security
Source: https://code.claude.com/docs/en/plugins/install
Source: https://code.claude.com/docs/en/plugins/components
Source: https://code.claude.com/docs/en/desktop
Source: https://code.claude.com/docs/en/features-overview
Checked: 2026-10-22

## F23 Subagents

- What they are: "the subagent does that work in its own context and returns only the summary." "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions." Claude delegates when a task matches a subagent's description. Files: `.claude/agents/` (project), `~/.claude/agents/` (yours), a plugin's `agents/`.
- Tools: "use the `tools` field as an allowlist or the `disallowedTools` field as a denylist." Without `tools`, a subagent inherits every tool available to subagents. Docs example: `disallowedTools: Write, Edit` keeps Bash, MCP tools and the rest. An entry with a specifier such as `Bash(git push *)` "still removes the whole tool"; to block only some commands, add a Bash deny rule to `permissions.deny` (applies to subagents too).
- Permission mode (sub-agents#permission-modes): unset `permissionMode` inherits the main conversation's mode. "When the main conversation is in `bypassPermissions`, `acceptEdits`, or auto mode, the subagent runs in that same mode and Claude Code ignores the `permissionMode` you set." Under auto mode the classifier checks the subagent's tool calls and reviews its final report. In `default`, `dontAsk` or `plan`, the subagent uses the mode you set (but never `bypassPermissions` unless the main conversation is in it).
- Plugin subagents: "For security reasons, plugin subagents don't support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields."
- Output scanning (sub-agents#subagent-output-scanning): "Claude Code scans each subagent's final report before Claude reads it." It inserts a backslash into text imitating Claude Code's own output (e.g. a `<system-reminder>` tag, a line starting `Human:`), and prepends a marker line `[harness: subagent output matched instruction-shaped pattern(s):` when the report imitates such a tag or mentions permission settings such as `bypassPermissions`. "The scan doesn't judge whether content is malicious, and it doesn't change what an instruction in a report can do: a tool call the report leads Claude to make still goes through the session's permission checks and sandboxing. It isn't a substitute for restricting what a subagent can reach."
Source: https://code.claude.com/docs/en/sub-agents
Checked: 2026-10-22

## F24 Installing packages and running downloaded code

What the official Claude Code docs say (searched permissions, permission-modes, security, setup, mcp, mcp-quickstart, plugins/loading, plugins/security, sandbox-environments, headless, auto-mode-config on 2026-10-22). The docs have no page on choosing packages: they don't mention lookalike ("typosquatted") or made-up package names, and don't explain npm's `postinstall` scripts or `npx -y` for your own project. Content teaches those as general software safety, never as a Claude Code feature.

- Auto mode, by default (permission-modes#what-the-classifier-blocks-by-default, also F4/F16): blocked: "Downloading and executing code, like `curl | bash`"; allowed: "Installing dependencies declared in your lock files or manifests". auto-mode-config lists `curl | bash` among the built-in `soft_deny` rules.
- UNVERIFIED: how auto mode treats installing a package that is not yet in your manifest (e.g. `npm install <new-name>`), or `npx -y <package>`. The docs list neither as blocked or allowed; content must not say auto mode catches (or allows) them.
- Manual mode (security#core-protections): "Commands that fetch content from the web such as `curl` and `wget` are not auto-approved by default. In Manual mode they prompt like any other non-read-only Bash command". `npm install` isn't in the read-only set (F14), so it prompts in Manual mode; `Bash(npm run *)` doesn't match `npm install` (permissions, rule examples table).
- Claude Code's own installer uses the download-and-run shape: `curl -fsSL https://claude.ai/install.sh | bash` (setup). Its npm install is `npm install -g @anthropic-ai/claude-code`, with the warning "Do NOT use `sudo npm install -g` as this can lead to permission issues and security risks." Releases publish a signed `manifest.json` of SHA256 checksums to verify binaries (setup#binary-integrity-and-code-signing).
- `npx -y` in the docs: MCP stdio servers are often launched with it, e.g. `claude mcp add playwright -- npx -y @playwright/mcp@latest` (mcp-quickstart), and "A launch command such as `npx -y @example/mcp-server`: the server runs on your machine" (mcp#add-a-server-from-setup-instructions-written-for-another-client). See F20.
- Plugin dependency installs (plugins/loading#limits-on-the-dependency-install): when Claude Code caches a plugin it installs the plugin's Node.js dependencies itself, constrained "so that no code from the plugin or its packages executes during it": registry packages pinned to exact versions only, `https` downloads, a separate install folder (npm/Bun don't read the plugin's `.npmrc` or `.env`), frozen resolution, and "**No lifecycle scripts**: `--ignore-scripts` keeps `preinstall`, `install`, and `postinstall` scripts from running". This applies only to that plugin install, not to `npm install` commands Claude runs in your project.
- Protected files (F14) include `.npmrc`, `.yarnrc`, `.pnpmfile.cjs`, `bunfig.toml`: writes to them are never auto-approved (except in `bypassPermissions`).
- General software safety (not Claude Code docs; taught as such): an npm package can declare `preinstall`/`install`/`postinstall` scripts that npm runs automatically during `npm install`, with your user's powers; a lookalike package copies a popular name with a small change (an extra or swapped letter, a different scope); an AI model can suggest a package name that doesn't exist, and anyone can later publish a package under that name; `curl <url> | sh` runs a downloaded script without saving it for you to read first; `npx -y <package>` downloads a package if it isn't installed and runs it, `-y` (`--yes`) skipping npx's "Ok to proceed?" question.
Source: https://code.claude.com/docs/en/permission-modes
Source: https://code.claude.com/docs/en/auto-mode-config
Source: https://code.claude.com/docs/en/security
Source: https://code.claude.com/docs/en/permissions
Source: https://code.claude.com/docs/en/setup
Source: https://code.claude.com/docs/en/mcp
Source: https://code.claude.com/docs/en/mcp-quickstart
Source: https://code.claude.com/docs/en/plugins/loading
Checked: 2026-10-22
