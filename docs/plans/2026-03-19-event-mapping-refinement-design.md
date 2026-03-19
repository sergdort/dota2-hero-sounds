# Design: Event Mapping Refinement Across All Tools

## Context

After reviewing Pi's extension docs and comparing event systems across all three tools, we found significant differences in what events are available. The current Pi extension guesses dangerous bash commands for the attention sound, which is not the right approach. Additionally, sounds can overlap when multiple events fire in quick succession.

## Event System Comparison

| Scenario | Claude Code | OpenCode | Pi |
|----------|------------|----------|----|
| Session start | `SessionStart` | plugin init | `session_start` |
| Task complete | `Stop` (only on normal completion) | `session.status` busy→idle | `agent_end` |
| Error/failure | `PostToolUseFailure` | `session.error` | `tool_execution_end` with `isError: true` |
| Needs attention | `Notification` | `permission.asked` | **No event** |
| User cancelled | `PostToolUseFailure` with `is_interrupt: true` (only during tool calls) | No event (cancel = busy→idle, same as completion) | No event (`agent_end` fires, no cancel flag) |
| Session exit | `SessionEnd` (with `reason` field) | No event | `session_shutdown` |

## Key Findings

### Cancellation — Deep Dive
None of the three tools provide a clean "user cancelled mid-stream" event:
- **Claude Code**: `Stop` does NOT fire on user interrupt. `PostToolUseFailure` fires with `is_interrupt: true` but only if a tool was running at the time. If interrupted during text generation, nothing fires.
- **OpenCode**: Cancellation sets `session.status` to `idle` — identical to normal completion. No way to distinguish.
- **Pi**: `agent_end` fires but has no cancellation flag in the payload. `session_shutdown` only fires on full exit (Ctrl+C/Ctrl+D/SIGTERM).

### Pi
- **No permission/attention event** — Pi doesn't emit events when the agent needs user input. Permission prompts are created by extensions themselves via `ctx.ui.confirm()`, not system events.
- **`agent_end`** — fires for both "task done" and "agent asking follow-up question." Distinguishing the two would require heuristic message content analysis.
- **`tool_execution_end`** — fires after each tool execution with `isError: true` if the tool failed. Can map to error sound.
- **`session_shutdown`** — fires on exit, maps cleanly to error/goodbye sound.

### OpenCode
- Has `permission.asked` for attention — works well.
- Has `session.status` busy→idle for completion — works well.
- Has `session.error` for errors — works well.

### Claude Code
- Has `Notification` for attention — works well.
- Has `Stop` for completion (normal only), `PostToolUseFailure` for errors — work well.
- Has `SessionStart` for start — works well.

## Sound Debouncing

**Problem**: Multiple events can fire in quick succession (e.g. `session.status` busy→idle followed immediately by another transition, or `tool_execution_end` errors firing rapidly). This causes overlapping sounds.

**Solution**: Add a debounce/cooldown mechanism — after playing a sound, ignore subsequent play requests for N milliseconds. This should be implemented in the shared `playSound()` function and in each tool's plugin/extension.

**Recommended cooldown**: 3 seconds. Short enough to not miss distinct events, long enough to prevent overlapping voice lines.

**Implementation**:
- In `src/play-sound.ts`: track `lastPlayedAt` timestamp. If `Date.now() - lastPlayedAt < cooldownMs`, skip.
- In OpenCode plugin and Pi extension: same pattern inline (they're self-contained).

## Proposed Changes — Only Certain Events

Principle: only play sounds for events we can detect with certainty. If a tool doesn't support a scenario, we don't implement it for that tool.

### Certainty Matrix

| Scenario | Claude Code | OpenCode | Pi |
|----------|:-----------:|:--------:|:--:|
| Session start | `SessionStart` | plugin init | `session_start` |
| Task complete | `Stop` | `session.status` busy→idle | `agent_end` |
| Error/failure | `PostToolUseFailure` | `session.error` | `tool_execution_end` `isError: true` |
| Needs attention | `Notification` | `permission.asked` | -- |
| Session exit | -- | -- | `session_shutdown` |

`--` = not supported, don't implement.

### 1. Pi Extension — 4 certain events only

| Category | Pi Event |
|----------|----------|
| `start` | `session_start` |
| `success` | `agent_end` |
| `error` | `tool_execution_end` with `isError: true` |
| `error` | `session_shutdown` |

Remove `tool_call` dangerous command hack entirely.

### 2. OpenCode Plugin — 4 certain events (no changes to events)

| Category | OpenCode Event |
|----------|----------------|
| `start` | plugin init |
| `success` | `session.status` busy→idle |
| `error` | `session.error` |
| `attention` | `permission.asked` |

### 3. Claude Code Hooks — 4 certain events (no changes)

| Category | Claude Code Hook |
|----------|-----------------|
| `start` | `SessionStart` |
| `success` | `Stop` |
| `error` | `PostToolUseFailure` |
| `attention` | `Notification` |

### 4. Add debounce to all sound players
- `src/play-sound.ts` — add 3s cooldown to `playSound()`
- OpenCode plugin — add 3s cooldown inline
- Pi extension — add 3s cooldown inline

### 5. Clean install — prevent leftover behavior from previous versions

Each tool's install path must ensure no old artifacts remain:

- **Claude Code**: Already safe. `installClaudeHooks()` removes all hooks tagged with `# dota2-code-sounds` before adding new ones.
- **OpenCode**: Already safe. `installOpenCodePlugin()` overwrites `~/.config/opencode/plugins/dota2-sounds.js` in place.
- **Pi**: Already safe. Now uses `pi install` (package-based). No leftover generated files from previous approach.

### 6. Update AGENTS.md and README.md
- **AGENTS.md**: Document per-tool event mappings, debounce behavior (3s cooldown), and which scenarios are supported per tool vs not implemented.
- **README.md**: Update "What Gets Installed" section with accurate event-to-sound mappings per tool. Add a note about the 3s debounce. Document that not all events are available in all tools (e.g. Pi has no attention sound).
