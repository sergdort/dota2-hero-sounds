import { CATEGORIES, type Category, loadSoundCategories } from './play-sound.js'

/**
 * Extract hero key from a sound filename.
 * Filenames follow Vo_<hero>_<shortcode>_<rest>.mp3
 * Returns the first segment after "Vo_" (e.g., "axe", "pudge", "queenofpain").
 */
export function extractHeroFromFilename(filename: string): string | null {
  const base = filename.replace(/^.*\//, '')
  const match = base.match(/^Vo_([^_]+)/)
  return match ? match[1] : null
}

/**
 * Filter sound paths to only those matching any of the given hero keys.
 * Uses prefix matching: a sound belongs to hero X if its basename starts with "Vo_X".
 */
export function filterSoundsByHeroes(sounds: string[], heroes: string[]): string[] {
  if (heroes.length === 0) return sounds
  return sounds.filter((sound) => {
    const base = sound.replace(/^.*\//, '')
    return heroes.some((hero) => base.startsWith(`Vo_${hero}_`))
  })
}

export interface HeroInfo {
  key: string
  counts: Record<Category, number>
  total: number
}

/**
 * Scan all sound files and return available heroes with per-category counts.
 */
export function getAvailableHeroes(): HeroInfo[] {
  const categories = loadSoundCategories()
  const heroMap = new Map<string, Record<string, number>>()

  for (const [category, sounds] of Object.entries(categories)) {
    for (const sound of sounds) {
      const hero = extractHeroFromFilename(sound)
      if (!hero) continue
      const counts = heroMap.get(hero) ?? {}
      counts[category] = (counts[category] ?? 0) + 1
      heroMap.set(hero, counts)
    }
  }

  const heroes: HeroInfo[] = []
  for (const [key, counts] of heroMap) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const fullCounts = {} as Record<Category, number>
    for (const cat of CATEGORIES) {
      fullCounts[cat] = counts[cat] ?? 0
    }
    heroes.push({ key, counts: fullCounts, total })
  }

  return heroes.sort((a, b) => b.total - a.total)
}
