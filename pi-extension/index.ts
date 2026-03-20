import { execFile } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
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

function getConfiguredHeroes(): string[] {
  try {
    const configPath = join(homedir(), '.config', 'dota2-sounds', 'config.json')
    if (!existsSync(configPath)) return []
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.heroes)) return parsed.heroes
    return []
  } catch {
    return []
  }
}

function filterByHeroes(sounds: string[], heroes: string[]): string[] {
  if (heroes.length === 0) return sounds
  return sounds.filter((s) => {
    const base = s.split('/').pop() || ''
    return heroes.some((h) => base.startsWith(`Vo_${h}_`))
  })
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
  let sounds = categories[category] ?? Object.values(categories).flat()
  const heroes = getConfiguredHeroes()
  if (heroes.length > 0) {
    const filtered = filterByHeroes(sounds, heroes)
    if (filtered.length > 0) sounds = filtered
  }
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
