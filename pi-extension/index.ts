import { execFile } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ExtensionAPI } from '@mariozechner/pi-coding-agent'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CATEGORIES = ['success', 'error', 'attention', 'start'] as const

/**
 * Resolve the sounds directory.
 * From pi-extension/index.ts -> ../sounds/
 */
function getSoundsDir(): string {
  return join(__dirname, '..', 'sounds')
}

/**
 * Scan sounds/<category>/ and return all .mp3 files grouped by category.
 */
function loadSoundCategories(): Record<string, string[]> {
  const soundsDir = getSoundsDir()
  const result: Record<string, string[]> = {}

  for (const category of CATEGORIES) {
    const categoryDir = join(soundsDir, category)
    if (!existsSync(categoryDir)) {
      result[category] = []
      continue
    }
    result[category] = readdirSync(categoryDir)
      .filter((f: string) => f.endsWith('.mp3'))
      .map((f: string) => join(soundsDir, category, f))
  }

  return result
}

let _categories: Record<string, string[]> | null = null

function getCategories(): Record<string, string[]> {
  if (!_categories) {
    _categories = loadSoundCategories()
  }
  return _categories
}

const COOLDOWN_MS = 3000
let lastPlayedAt = 0

function randomPick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

function playSound(category: string): void {
  const now = Date.now()
  if (now - lastPlayedAt < COOLDOWN_MS) return
  const categories = getCategories()
  const sounds = categories[category] ?? Object.values(categories).flat()
  if (sounds.length === 0) return
  const soundPath = randomPick(sounds)
  lastPlayedAt = now
  execFile('afplay', [soundPath], () => {})
}

export default function (pi: ExtensionAPI) {
  // Play start sound when session begins
  pi.on('session_start', async () => {
    playSound('start')
  })

  // Play success sound when agent finishes responding
  pi.on('agent_end', async () => {
    playSound('success')
  })

  // Play error sound when a tool execution fails
  pi.on('tool_execution_end', async (event) => {
    if (event.isError) {
      playSound('error')
    }
  })

  // Play error sound on session shutdown
  pi.on('session_shutdown', async () => {
    playSound('error')
  })
}
