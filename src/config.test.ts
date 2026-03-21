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
})

describe('writeConfig', () => {
  it('writes formatted JSON with trailing newline', () => {
    mockExistsSync.mockReturnValue(true)

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
})
