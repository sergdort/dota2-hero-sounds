# dota2-code-sounds

Dota 2 Axe voice line notifications for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [OpenCode](https://opencode.ai). Get notified with Axe's wisdom when your AI coding assistant completes tasks, hits errors, or needs your attention.

## Quick Start

```bash
npx dota2-code-sounds install
```

This auto-detects which tools you have installed and configures them. Use flags to target a specific tool:

```bash
npx dota2-code-sounds install --claude     # Claude Code only
npx dota2-code-sounds install --opencode   # OpenCode only
npx dota2-code-sounds install --all        # Both
```

## How It Works

When events occur in your coding tool, Axe speaks:

| Event | Category | What Axe Says |
|-------|----------|---------------|
| Task complete | `success` | "Good work!", "Nice! Thanks!", "Don't mind if I do!", "Axe-actly!", "All mine!", "I am greatly moved.", "What happened? Axe happened!" and more |
| Error | `error` | "All your fault!", "All fall down.", "Bury me here.", "A better time will present itself.", "I miss my gargoyle friends..." |
| Needs attention | `attention` | "Hey! I was thinking!", "Hey, wait for us!", "After you! No, me first!", "Be still." |
| Session start | `start` | "TO THE ENEMY!", "Yes, Axe kills you!", "Back for more!", "Blink dagger. Now it's on.", "I quake with power!" |

A random sound is picked from the matching category each time.

## CLI Commands

```bash
dota2-code-sounds install     # Install hooks/plugins
dota2-code-sounds uninstall   # Remove everything cleanly
dota2-code-sounds test        # Play one sound per category
dota2-code-sounds list        # Show all sounds by category
dota2-code-sounds help        # Show help
```

## What Gets Installed

**Claude Code** — Hooks added to `~/.claude/settings.json`:
- `Stop` → plays success sound
- `PostToolUseFailure` → plays error sound
- `Notification` → plays attention sound
- `SessionStart` → plays start sound

**OpenCode** — Plugin written to `~/.config/opencode/plugins/dota2-sounds.js`:
- `session.idle` → plays success sound
- `session.error` → plays error sound
- `permission.asked` → plays attention sound
- `session.created` → plays start sound

## Uninstall

```bash
npx dota2-code-sounds uninstall
```

This cleanly removes only the hooks/plugins added by this package — your other settings are untouched.

## Adding Custom Sounds

1. Add `.mp3` files to the `sounds/` directory in the installed package
2. Edit `src/play-sound.ts` to add them to the appropriate category
3. Rebuild with `npm run build`
4. Re-run `dota2-code-sounds install` to update paths

## Requirements

- **macOS** (uses `afplay` for audio playback)
- **Node.js** 18+
- Claude Code and/or OpenCode installed

## License

MIT
