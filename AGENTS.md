# dota2-code-sounds

Dota 2 hero voice line notifications for Claude Code and OpenCode.

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
node dist/cli.js install --all      # install for both tools
node dist/cli.js uninstall          # remove all hooks/plugins
```

## Architecture

```
src/
  play-sound.ts     — Core: category definitions, random selection, afplay
  play.ts           — Standalone entry point for hooks: node dist/play.js <category>
  cli.ts            — Commander.js CLI (install/uninstall/test/list)
  claude-hooks.ts   — Reads/writes Claude Code hooks in ~/.claude/settings.json
  opencode-plugin.ts — Generates self-contained OpenCode plugin to ~/.config/opencode/plugins/
sounds/
  success/          — Positive/victorious lines (task completion)
  error/            — Defeat/blame/sadness lines (failures)
  attention/        — Waiting/thinking lines (permission prompts)
  start/            — Battle cries/power-up lines (session start)
```

### Key implementation details

- OpenCode plugin uses `session.status` busy->idle transition for completion detection, not `session.idle`
- OpenCode plugin plays start sound on plugin init since `session.created` fires before plugin loads
- Claude Code hooks call `node <abs-path>/dist/play.js <category>` with absolute paths resolved at install time
- Hooks are tagged with `# dota2-code-sounds` comment for clean install/uninstall
- Sound playback is async/non-blocking (detached `afplay` process)

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
2. Add the path (e.g. `"success/new-sound.mp3"`) to the matching category array in `src/play-sound.ts`
3. Run `pnpm build` to compile
4. Run `node dist/cli.js install` to regenerate hooks/plugin with updated categories
5. macOS only (uses `afplay`); cross-platform support planned for future

## Agent notes

- Every time you learn something new, or how to do something in the codebase, if you make a mistake that the user corrects, if you find yourself running commands that are often wrong and have to tweak them: write all of this down in `.agents/notes.md`. This is a file just for you that your user won't read.
- If you're about to write to it, first check if what you're writing (the idea, not 1:1) is already present. If so, increment the counter in the prefix (eg from `[0]` to `[1]`). If it's completely new, prefix it with `[0]`. Once a comment hits the count of `3`, codify it into this AGENTS.md file in the `## Misc` section.
Some of the notes it’s been taking so far:
