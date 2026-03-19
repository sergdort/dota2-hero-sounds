import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Sound category names.
 */
export const CATEGORIES = ['success', 'error', 'attention', 'start'] as const
export type Category = (typeof CATEGORIES)[number]

/**
 * Resolve the absolute path to the sounds/ directory.
 * Works whether running from src/ (dev) or dist/ (built).
 */
export function getSoundsDir(): string {
  return join(__dirname, '..', 'sounds')
}

/**
 * Scan the sounds/<category>/ directories and return all .mp3 files
 * grouped by category. Discovers sounds at runtime so new files
 * are picked up without code changes.
 */
export function loadSoundCategories(): Record<string, string[]> {
  const soundsDir = getSoundsDir()
  const result: Record<string, string[]> = {}

  for (const category of CATEGORIES) {
    const categoryDir = join(soundsDir, category)
    if (!existsSync(categoryDir)) {
      result[category] = []
      continue
    }
    result[category] = readdirSync(categoryDir)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => `${category}/${f}`)
  }

  return result
}

/** Lazily loaded sound categories (populated on first use). */
let _categories: Record<string, string[]> | null = null

function getCategories(): Record<string, string[]> {
  if (!_categories) {
    _categories = loadSoundCategories()
  }
  return _categories
}

function getAllSounds(): string[] {
  return Object.values(getCategories()).flat()
}

/**
 * Pick a random element from an array.
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Cooldown in ms to prevent overlapping sounds. */
const COOLDOWN_MS = 3000

/** Timestamp of the last sound played. */
let lastPlayedAt = 0

/**
 * Play a sound from the given category.
 * Picks a random sound from the category, or from all sounds if category is unknown.
 * Fires and forgets — does not block.
 * Debounced: skips if a sound was played within the last 3 seconds.
 *
 * @param category - One of: success, error, attention, start
 */
export function playSound(category: string): void {
  const now = Date.now()
  if (now - lastPlayedAt < COOLDOWN_MS) {
    return
  }

  const categories = getCategories()
  const sounds = categories[category] ?? getAllSounds()

  if (sounds.length === 0) {
    process.stderr.write(`dota2-code-sounds: no sounds found for category: ${category}\n`)
    return
  }

  const soundFile = randomPick(sounds)
  const soundPath = join(getSoundsDir(), soundFile)

  if (!existsSync(soundPath)) {
    process.stderr.write(`dota2-code-sounds: sound file not found: ${soundPath}\n`)
    return
  }

  lastPlayedAt = now

  // Fire and forget — detached so it doesn't block the parent process
  const child = spawn('afplay', [soundPath], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
}

/**
 * List all available categories and their sounds.
 */
export function listSounds(): Record<string, string[]> {
  return getCategories()
}
