import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readConfig, writeConfig } from './config.js'

vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const mockExistsSync = vi.mocked(existsSync)
const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('readConfig', () => {
  it('returns empty heroes when config file is missing', () => {
    mockExistsSync.mockReturnValue(false)
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('returns heroes from valid config', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe', 'pudge'] }))
    expect(readConfig()).toEqual({ heroes: ['axe', 'pudge'] })
  })

  it('returns empty heroes for invalid JSON', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('not json{{{')
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('returns empty heroes when heroes is not an array', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: 'axe' }))
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('filters non-string values from heroes array', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe', 42, null, 'pudge', true] }))
    expect(readConfig()).toEqual({ heroes: ['axe', 'pudge'] })
  })

  it('returns empty heroes when heroes key is missing', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ something: 'else' }))
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('returns soundsDir when present in config', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe'], soundsDir: '/my/sounds' }))
    expect(readConfig()).toEqual({ heroes: ['axe'], soundsDir: '/my/sounds' })
  })

  it('omits soundsDir when it is not a string', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: [], soundsDir: 42 }))
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('omits soundsDir when it is an empty string', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: [], soundsDir: '' }))
    expect(readConfig()).toEqual({ heroes: [] })
  })

  it('returns muted and enabledEvents when present in config', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ heroes: [], muted: true, enabledEvents: ['error', 'turn_complete'] }),
    )
    expect(readConfig()).toEqual({
      heroes: [],
      muted: true,
      enabledEvents: ['error', 'turn_complete'],
    })
  })

  it('filters non-string values from enabledEvents and omits non-boolean muted', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ heroes: [], muted: 'yes', enabledEvents: ['error', 42, null] }),
    )
    expect(readConfig()).toEqual({ heroes: [], enabledEvents: ['error'] })
  })
})

describe('writeConfig', () => {
  it('writes formatted JSON with trailing newline', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: [] }))

    writeConfig({ heroes: ['axe'] })

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/mock/home/.config/dota2-sounds/config.json',
      '{\n  "heroes": [\n    "axe"\n  ]\n}\n',
      'utf-8',
    )
  })

  it('creates directory if missing', () => {
    mockExistsSync.mockReturnValue(false)

    writeConfig({ heroes: [] })

    expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.config/dota2-sounds', { recursive: true })
  })

  it('setting soundsDir preserves existing heroes', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe', 'pudge'] }))

    writeConfig({ soundsDir: '/my/sounds' })

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
    expect(written).toEqual({ heroes: ['axe', 'pudge'], soundsDir: '/my/sounds' })
  })

  it('setting heroes preserves existing soundsDir', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe'], soundsDir: '/my/sounds' }))

    writeConfig({ heroes: ['pudge'] })

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
    expect(written).toEqual({ heroes: ['pudge'], soundsDir: '/my/sounds' })
  })

  it('clearing soundsDir removes the key from JSON', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe'], soundsDir: '/my/sounds' }))

    writeConfig({ soundsDir: undefined })

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
    expect(written).toEqual({ heroes: ['axe'] })
    expect(written).not.toHaveProperty('soundsDir')
  })

  it('setting notification fields preserves existing config', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ heroes: ['axe'], soundsDir: '/my/sounds' }))

    writeConfig({ muted: true, enabledEvents: ['error'] })

    const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
    expect(written).toEqual({
      heroes: ['axe'],
      soundsDir: '/my/sounds',
      muted: true,
      enabledEvents: ['error'],
    })
  })
})
