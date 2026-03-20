# dota2-code-sounds

Dota 2 hero voice line notifications for Claude Code, OpenCode, and Pi.

## Living document

This is a leaving document if anything in the project changes that affects the content if this file. You need to update it.
If during the sessions you notice there are some inconsistencies with the project and this document. Point it out and propose the changes.

## Build & Test

```bash
pnpm build                          # compile TypeScript to dist/
pnpm build && node dist/cli.js test # build and test all sound categories
node dist/cli.js test <category>    # test one category: success, error, attention, start
node dist/cli.js list               # show all sounds by category
node dist/cli.js install --claude   # install Claude Code hooks
node dist/cli.js install --opencode # install OpenCode plugin
node dist/cli.js install --pi       # install Pi extension
node dist/cli.js install --all      # install for all tools
node dist/cli.js uninstall          # remove all hooks/plugins
node dist/cli.js hero list          # show available heroes with per-category counts
node dist/cli.js hero set axe pudge # set preferred heroes
node dist/cli.js hero show          # show current hero preference
node dist/cli.js hero clear         # clear preference (use all heroes)
pnpm lint                           # check for lint/format issues
pnpm check                          # auto-fix lint/format issues
```

## Architecture

```
src/
  play-sound.ts     — Core: category definitions, random selection, afplay, hero filtering
  play.ts           — Standalone entry point for hooks: node dist/play.js <category>
  cli.ts            — Commander.js CLI (install/uninstall/test/list/hero)
  config.ts         — Reads/writes hero config from ~/.config/dota2-sounds/config.json
  heroes.ts         — Hero extraction from filenames, filtering, listing
  claude-hooks.ts   — Reads/writes Claude Code hooks in ~/.claude/settings.json
  opencode-plugin.ts — Generates self-contained OpenCode plugin to ~/.config/opencode/plugins/
  pi-extension.ts   — Installs/removes Pi extension via `pi install`/`pi remove`
pi-extension/
  index.ts          — Pi extension entry point (loaded by Pi via jiti, no compilation)
  package.json      — Pi package manifest with "pi" key
sounds/
  success/          — Positive/victorious lines (task completion)
  error/            — Defeat/blame/sadness lines (failures)
  attention/        — Waiting/thinking lines (permission prompts)
  start/            — Battle cries/power-up lines (session start)
```

### Key implementation details

- Claude Code hooks call `node <abs-path>/dist/play.js <category>` with absolute paths resolved at install time
- Hooks are tagged with `# dota2-code-sounds` comment for clean install/uninstall
- OpenCode plugin uses `session.status` busy->idle transition for completion detection, not `session.idle`
- OpenCode plugin plays start sound on plugin init since `session.created` fires before plugin loads
- Pi extension uses `session_start`, `agent_end`, `tool_execution_end`, and `session_shutdown` events
- Pi extension plays attention sound only for dangerous bash commands (rm, sudo, chmod, etc.)
- Sound playback is async/non-blocking (detached `afplay` process)
- All sound players have a 3-second debounce cooldown to prevent overlapping sounds
- Hero preferences stored in `~/.config/dota2-sounds/config.json`, read at runtime by all tools
- Hero name extracted from filename prefix `Vo_<hero>_` — first segment after `Vo_` is the hero key
- If configured heroes have no sounds for a category, falls back to all heroes

### Event mapping per tool

Only events with certain detection are implemented. If a tool doesn't support a scenario, it's not implemented.

| Scenario | Claude Code | OpenCode | Pi |
|----------|------------|----------|----|
| Session start | `SessionStart` | plugin init | `session_start` |
| Task complete | `Stop` | `session.status` busy→idle | `agent_end` |
| Error/failure | `PostToolUseFailure` | `session.error` | `tool_execution_end` (`isError`) |
| Needs attention | `Notification` | `permission.asked` | *not supported* |
| Session exit | *not supported* | *not supported* | `session_shutdown` |

## Sound Categories

Sounds are organized into subdirectories matching their category:

- **success** — positive/victorious lines for task completion (e.g. "Good work!", "Axe-actly!", "All mine!")
- **error** — defeat/blame/sadness lines for failures (e.g. "All your fault!", "Bury me here.", "All fall down.")
- **attention** — waiting/thinking lines for permission prompts (e.g. "Hey, I was thinking!", "Be still.")
- **start** — battle cries/power-up lines for session start (e.g. "TO THE ENEMY!", "Back for more!")

Categorize by the line's *emotional meaning*, not its literal words. Voice lines come from various Dota 2 heroes, not only Axe.

To transcribe an unfamiliar sound file:
```bash
whisper-cli -m /opt/homebrew/share/whisper-cpp/ggml-base.en.bin --no-timestamps -f sounds/<category>/<file>.mp3
```

## Contributing

1. Add new `.mp3` files to the appropriate `sounds/<category>/` subdirectory
2. Sound files are discovered at runtime — no code changes needed
3. Run `pnpm build` to compile
4. Run `node dist/cli.js install` to regenerate hooks/plugin
5. macOS only (uses `afplay`); cross-platform support planned for future

## Agent notes

- Every time you learn something new, or how to do something in the codebase, if you make a mistake that the user corrects, if you find yourself running commands that are often wrong and have to tweak them: write all of this down in `.agents/notes.md`. This is a file just for you that your user won't read.
- If you're about to write to it, first check if what you're writing (the idea, not 1:1) is already present. If so, increment the counter in the prefix (eg from `[0]` to `[1]`). If it's completely new, prefix it with `[0]`. Once a comment hits the count of `3`, codify it into this AGENTS.md file in the `## Misc` section.
Some of the notes it’s been taking so far:
