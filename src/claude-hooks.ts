import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Marker used to identify hooks added by this package,
 * so we can cleanly uninstall without touching user-defined hooks.
 */
const HOOK_MARKER = 'dota2-hero-sounds'

interface HookEntry {
  matcher: string
  hooks: Array<{
    type: string
    command: string
  }>
}

interface ClaudeSettings {
  hooks?: Record<string, HookEntry[]>
  [key: string]: unknown
}

/**
 * Get the path to Claude Code's global settings file.
 */
export function getClaudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json')
}

/**
 * Check if Claude Code config directory exists.
 */
export function isClaudeCodeAvailable(): boolean {
  return existsSync(join(homedir(), '.claude'))
}

/**
 * Build the hooks configuration for Claude Code.
 * @param playScriptPath - Absolute path to dist/play.js
 */
function buildHooks(playScriptPath: string): Record<string, HookEntry[]> {
  const makeHook = (category: string): HookEntry => ({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node "${playScriptPath}" ${category} # ${HOOK_MARKER}`,
      },
    ],
  })

  return {
    Stop: [makeHook('success')],
    PostToolUseFailure: [makeHook('error')],
    Notification: [makeHook('attention')],
    SessionStart: [makeHook('start')],
  }
}

/**
 * Install Claude Code hooks into ~/.claude/settings.json.
 * Merges with existing hooks without overwriting user-defined ones.
 */
export function installClaudeHooks(playScriptPath: string): void {
  const settingsPath = getClaudeSettingsPath()
  const settingsDir = join(homedir(), '.claude')

  // Ensure directory exists
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true })
  }

  // Read existing settings or start fresh
  let settings: ClaudeSettings = {}
  if (existsSync(settingsPath)) {
    const raw = readFileSync(settingsPath, 'utf-8')
    settings = JSON.parse(raw) as ClaudeSettings
  }

  // Remove any existing dota2-hero-sounds hooks first (clean reinstall)
  if (settings.hooks) {
    for (const event of Object.keys(settings.hooks)) {
      settings.hooks[event] = settings.hooks[event].filter(
        (entry) => !entry.hooks.some((h) => h.command.includes(HOOK_MARKER)),
      )
      // Remove the event key entirely if no hooks remain
      if (settings.hooks[event].length === 0) {
        delete settings.hooks[event]
      }
    }
  }

  // Merge new hooks
  const newHooks = buildHooks(playScriptPath)
  if (!settings.hooks) {
    settings.hooks = {}
  }

  for (const [event, hookEntries] of Object.entries(newHooks)) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = []
    }
    settings.hooks[event].push(...hookEntries)
  }

  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8')
}

/**
 * Remove all dota2-hero-sounds hooks from ~/.claude/settings.json.
 */
export function uninstallClaudeHooks(): void {
  const settingsPath = getClaudeSettingsPath()
  if (!existsSync(settingsPath)) {
    return
  }

  const raw = readFileSync(settingsPath, 'utf-8')
  const settings = JSON.parse(raw) as ClaudeSettings

  if (!settings.hooks) {
    return
  }

  for (const event of Object.keys(settings.hooks)) {
    settings.hooks[event] = settings.hooks[event].filter(
      (entry) => !entry.hooks.some((h) => h.command.includes(HOOK_MARKER)),
    )
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event]
    }
  }

  // Remove hooks key entirely if empty
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks
  }

  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8')
}
