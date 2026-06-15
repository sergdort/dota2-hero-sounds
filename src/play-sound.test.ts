import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(() => []),
}))

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({ unref: vi.fn() })),
}))

vi.mock('./config.js', () => ({
  readConfig: vi.fn(() => ({ heroes: [] })),
}))

vi.mock('./heroes.js', () => ({
  filterSoundsByHeroes: vi.fn((sounds: string[]) => sounds),
}))

import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { readConfig } from './config.js'
import { getSoundsDir, notifyEvent, playCategory } from './play-sound.js'

const mockExistsSync = vi.mocked(existsSync)
const mockReaddirSync = vi.mocked(readdirSync)
const mockSpawn = vi.mocked(spawn)
const mockReadConfig = vi.mocked(readConfig)

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  mockReadConfig.mockReturnValue({ heroes: [] })
  mockReaddirSync.mockReturnValue(['Vo_axe_test.mp3'] as never)
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

describe('notification playback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    mockExistsSync.mockReturnValue(true)
  })

  it('suppresses semantic events when muted', () => {
    mockReadConfig.mockReturnValue({ heroes: [], muted: true })

    notifyEvent('turn_complete')

    expect(mockSpawn).not.toHaveBeenCalled()
  })

  it('suppresses disabled semantic events', () => {
    mockReadConfig.mockReturnValue({ heroes: [], enabledEvents: ['error'] })

    notifyEvent('turn_complete')

    expect(mockSpawn).not.toHaveBeenCalled()
  })

  it('plays enabled semantic events through their mapped category', () => {
    mockReadConfig.mockReturnValue({ heroes: [], enabledEvents: ['turn_complete'] })

    notifyEvent('turn_complete')

    expect(mockSpawn).toHaveBeenCalledWith(
      'afplay',
      [expect.stringContaining('/success/Vo_axe_test.mp3')],
      expect.objectContaining({ detached: true }),
    )
  })

  it('lets direct category playback bypass mute and event preferences', () => {
    vi.setSystemTime(20_000)
    mockReadConfig.mockReturnValue({ heroes: [], muted: true, enabledEvents: [] })

    playCategory('success')

    expect(mockSpawn).toHaveBeenCalled()
  })
})
