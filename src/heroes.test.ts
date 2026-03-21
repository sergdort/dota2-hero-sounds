import { describe, expect, it, vi } from 'vitest'
import { extractHeroFromFilename, filterSoundsByHeroes, getAvailableHeroes } from './heroes.js'

vi.mock('./play-sound.js', () => ({
  CATEGORIES: ['success', 'error', 'attention', 'start'] as const,
  loadSoundCategories: () => ({
    success: ['success/Vo_axe_axe_kill_01.mp3', 'success/Vo_pudge_pud_deny_01.mp3'],
    error: ['error/Vo_axe_axe_respawn_01.mp3'],
    attention: ['attention/Vo_pudge_pud_move_01.mp3', 'attention/Vo_lina_lina_cast_01.mp3'],
    start: ['start/Vo_axe_axe_spawn_01.mp3', 'start/Vo_lina_lina_spawn_01.mp3'],
  }),
}))

describe('extractHeroFromFilename', () => {
  it('extracts hero from simple filename', () => {
    expect(extractHeroFromFilename('Vo_axe_axe_spawn_02.mp3')).toBe('axe')
  })

  it('extracts hero from relative path', () => {
    expect(extractHeroFromFilename('success/Vo_pudge_pud_deny_01.mp3')).toBe('pudge')
  })

  it('extracts hero from absolute path', () => {
    expect(extractHeroFromFilename('/abs/path/Vo_queenofpain_pain_kill_01.mp3')).toBe('queenofpain')
  })

  it('extracts multi-word hero names that are single segments', () => {
    expect(extractHeroFromFilename('Vo_stormspirit_ss_ability_01.mp3')).toBe('stormspirit')
    expect(extractHeroFromFilename('Vo_crystalmaiden_cm_spawn_02.mp3')).toBe('crystalmaiden')
  })

  it('returns null for files without Vo_ prefix', () => {
    expect(extractHeroFromFilename('random_file.mp3')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractHeroFromFilename('')).toBeNull()
  })
})

describe('filterSoundsByHeroes', () => {
  const sounds = [
    'success/Vo_axe_axe_kill_01.mp3',
    'success/Vo_pudge_pud_deny_01.mp3',
    'error/Vo_axe_axe_respawn_01.mp3',
    'attention/Vo_lina_lina_move_01.mp3',
    'start/Vo_dark_seer_ds_spawn_01.mp3',
  ]

  it('returns all sounds when heroes is empty', () => {
    expect(filterSoundsByHeroes(sounds, [])).toEqual(sounds)
  })

  it('filters to a single hero', () => {
    const result = filterSoundsByHeroes(sounds, ['axe'])
    expect(result).toEqual(['success/Vo_axe_axe_kill_01.mp3', 'error/Vo_axe_axe_respawn_01.mp3'])
  })

  it('filters to multiple heroes', () => {
    const result = filterSoundsByHeroes(sounds, ['axe', 'lina'])
    expect(result).toEqual([
      'success/Vo_axe_axe_kill_01.mp3',
      'error/Vo_axe_axe_respawn_01.mp3',
      'attention/Vo_lina_lina_move_01.mp3',
    ])
  })

  it('returns empty array when no heroes match', () => {
    expect(filterSoundsByHeroes(sounds, ['zuus'])).toEqual([])
  })

  it('does not match hero key as prefix of another hero name', () => {
    // "dark" should match "Vo_dark_" but not "Vo_darkseer_"
    const testSounds = ['start/Vo_dark_seer_ds_spawn_01.mp3', 'start/Vo_darkseer_ds_spawn_01.mp3']
    const result = filterSoundsByHeroes(testSounds, ['dark'])
    expect(result).toEqual(['start/Vo_dark_seer_ds_spawn_01.mp3'])
  })
})

describe('getAvailableHeroes', () => {
  it('returns heroes sorted by total sound count descending', () => {
    const heroes = getAvailableHeroes()
    expect(heroes[0].total).toBeGreaterThanOrEqual(heroes[1].total)
    expect(heroes[1].total).toBeGreaterThanOrEqual(heroes[2].total)
  })

  it('returns correct hero keys', () => {
    const heroes = getAvailableHeroes()
    const keys = heroes.map((h) => h.key)
    expect(keys).toEqual(expect.arrayContaining(['axe', 'pudge', 'lina']))
    expect(keys).toHaveLength(3)
  })

  it('counts sounds per category correctly', () => {
    const heroes = getAvailableHeroes()
    const axe = heroes.find((h) => h.key === 'axe')
    expect(axe).toBeDefined()
    expect(axe?.counts.success).toBe(1)
    expect(axe?.counts.error).toBe(1)
    expect(axe?.counts.attention).toBe(0)
    expect(axe?.counts.start).toBe(1)
    expect(axe?.total).toBe(3)
  })

  it('fills zero for categories with no sounds', () => {
    const heroes = getAvailableHeroes()
    const pudge = heroes.find((h) => h.key === 'pudge')
    expect(pudge).toBeDefined()
    expect(pudge?.counts.error).toBe(0)
    expect(pudge?.counts.start).toBe(0)
  })
})
