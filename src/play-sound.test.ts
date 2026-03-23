import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(() => []),
}))

vi.mock('./config.js', () => ({
  readConfig: vi.fn(() => ({ heroes: [] })),
}))

vi.mock('./heroes.js', () => ({
  filterSoundsByHeroes: vi.fn((sounds: string[]) => sounds),
}))

import { existsSync } from 'node:fs'
import { readConfig } from './config.js'
import { getSoundsDir } from './play-sound.js'

const mockExistsSync = vi.mocked(existsSync)
const mockReadConfig = vi.mocked(readConfig)

beforeEach(() => {
  vi.clearAllMocks()
  mockReadConfig.mockReturnValue({ heroes: [] })
})

describe('getSoundsDir', () => {
  it('returns soundsDir from config when set', () => {
    mockReadConfig.mockReturnValue({ heroes: [], soundsDir: '/custom/sounds' })

    expect(getSoundsDir()).toBe('/custom/sounds')
  })

  it('returns installed dir when it exists and no config soundsDir', () => {
    mockReadConfig.mockReturnValue({ heroes: [] })
    mockExistsSync.mockReturnValue(true)

    expect(getSoundsDir()).toBe('/mock/home/.config/dota2-sounds/sounds')
  })

  it('falls back to package-relative path when installed dir does not exist', () => {
    mockReadConfig.mockReturnValue({ heroes: [] })
    mockExistsSync.mockReturnValue(false)

    const result = getSoundsDir()
    expect(result).toMatch(/sounds$/)
    expect(result).not.toContain('.config')
  })
})
