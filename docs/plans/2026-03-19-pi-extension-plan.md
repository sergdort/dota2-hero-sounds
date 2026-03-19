# Implementation Plan: Pi Coding Agent Extension

## Reference

Pi extensions docs: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs/extensions.md

## Goal

Add Pi coding agent support to dota2-code-sounds. The CLI installer generates a self-contained TypeScript extension at `~/.pi/agent/extensions/dota2-sounds.ts`. Pi loads `.ts` files directly via jiti — no compilation needed.

---

## Step 1: Create `src/pi-extension.ts`

Generator module (mirrors `src/opencode-plugin.ts`):

- Export `getPiExtensionsDir()` → `~/.pi/agent/extensions/`
- Export `getPiExtensionPath()` → `~/.pi/agent/extensions/dota2-sounds.ts`
- Export `isPiAvailable()` → checks if `~/.pi/agent/` exists
- Export `installPiExtension()` → generates self-contained `.ts` file with:
  - Sound categories and paths baked in at install time
  - `session_start` → plays start sound
  - `agent_end` → plays success sound
  - `tool_call` (bash with dangerous patterns) → plays attention sound
  - `session_shutdown` → plays error sound
  - Uses `execFile("afplay", ...)` from `node:child_process`
- Export `uninstallPiExtension()` → removes the extension file

---

## Step 2: Update `src/cli.ts`

- Add `--pi` flag to `install` command
- Add `--pi` flag to `uninstall` command
- Auto-detect Pi in auto-detect mode (check `~/.pi/agent/` exists)
- `--all` flag should include Pi

---

## Step 3: Update `package.json`

- Add `start:pi` script: `node dist/cli.js install --pi`

---

## Step 4: Update AGENTS.md and README.md

- Add Pi to the list of supported tools
- Document Pi extension install/uninstall
- Add Pi event mapping to architecture section

---

## Step 5: Build, lint, and test

- `pnpm check` — lint passes
- `pnpm build` — compiles cleanly
- `pnpm start install --pi` — generates extension at `~/.pi/agent/extensions/dota2-sounds.ts`
- `pnpm start uninstall --pi` — removes it cleanly
- Verify extension file is valid TypeScript with correct imports
