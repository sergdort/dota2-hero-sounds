# dota2-code-sounds

Dota 2 hero voice line notifications for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [OpenCode](https://opencode.ai), and [Pi](https://pi.dev). Get notified with voice lines from Axe, Crystal Maiden, Pudge, Zeus, and many more when your AI coding assistant completes tasks, hits errors, or needs your attention.

## Quick Start

```bash
npx dota2-code-sounds install
```

This auto-detects which tools you have installed and configures them. Use flags to target a specific tool:

```bash
npx dota2-code-sounds install --claude     # Claude Code only
npx dota2-code-sounds install --opencode   # OpenCode only
npx dota2-code-sounds install --pi         # Pi only
npx dota2-code-sounds install --all        # All three
```

## How It Works

When events occur in your coding tool, a random hero speaks:

| Event | Category | Example Lines |
|-------|----------|---------------|
| Task complete | `success` | "Yes, Axe kills you!", "Burns, doesn't it?", "Told you a storm was coming!" |
| Error | `error` | "An anchor around my neck!", "Okay, sure, I've made some mistakes.", "That was just a warm-up." |
| Needs attention | `attention` | "Come to Pudge!", "Prepare thyself.", "Agony awaits." |
| Session start | `start` | "Let the carnage begin!", "Storm Spirit is alive!", "Your God has arrived." |

A random sound is picked from the matching category each time. Sounds have a 3-second cooldown to prevent overlapping voice lines.

## Hero Selection

By default, sounds are picked randomly from all heroes. You can set preferred heroes:

```bash
npx dota2-code-sounds hero list          # Show available heroes with sound counts
npx dota2-code-sounds hero set axe pudge # Only play Axe and Pudge sounds
npx dota2-code-sounds hero show          # Show current preference
npx dota2-code-sounds hero clear         # Reset to all heroes
```

Hero preferences are saved to `~/.config/dota2-sounds/config.json` and take effect immediately — no reinstall needed. If a selected hero has no sounds for a category, it falls back to all heroes for that category.

## CLI Commands

```bash
dota2-code-sounds install     # Install hooks/plugins
dota2-code-sounds uninstall   # Remove everything cleanly
dota2-code-sounds test        # Play one sound per category
dota2-code-sounds list        # Show all sounds by category
dota2-code-sounds hero list   # Show heroes with per-category counts
dota2-code-sounds hero set    # Set preferred heroes
dota2-code-sounds help        # Show help
```

## What Gets Installed

**Claude Code** — Hooks added to `~/.claude/settings.json`:
- `Stop` → plays success sound
- `PostToolUseFailure` → plays error sound
- `Notification` → plays attention sound
- `SessionStart` → plays start sound

**OpenCode** — Plugin written to `~/.config/opencode/plugins/dota2-sounds.js`:
- `session.status` busy→idle transition → plays success sound
- `session.error` → plays error sound
- `permission.asked` → plays attention sound
- Plugin init → plays start sound (session.created fires too early)

**Pi** — Extension installed via `pi install` as a Pi package:
- `session_start` → plays start sound
- `agent_end` → plays success sound
- `tool_execution_end` (when `isError`) → plays error sound
- `session_shutdown` → plays error sound
- *Attention sound not available* — Pi has no permission/notification event

## Uninstall

```bash
npx dota2-code-sounds uninstall
```

This cleanly removes only the hooks/plugins added by this package — your other settings are untouched.

## Adding Custom Sounds

1. Add `.mp3` files to the appropriate `sounds/<category>/` subdirectory
2. Sound files are discovered at runtime — no code changes needed
3. Re-run `dota2-code-sounds install` to update the OpenCode plugin with new sounds

Sound files should follow the naming convention `Vo_<hero>_<shortname>_<type>_<num>.mp3` to enable future hero-based filtering.

## Finding More Sounds

Browse the full collection of Dota 2 hero voice lines at the [Dota 2 Wiki Audio Category](https://dota2.fandom.com/wiki/Category:Audio). Each hero has hundreds of voice lines covering spawns, kills, abilities, and more.

## Requirements

- **macOS** (uses `afplay` for audio playback)
- **Node.js** 18+
- Claude Code, OpenCode, and/or Pi installed

## License

MIT
