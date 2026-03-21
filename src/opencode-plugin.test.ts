import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getOpenCodePluginPath,
  getOpenCodePluginsDir,
  installOpenCodePlugin,
  isOpenCodeAvailable,
  uninstallOpenCodePlugin,
} from './opencode-plugin.js'

vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}))

vi.mock('./play-sound.js', () => ({
  getSoundsDir: () => '/mock/project/sounds',
}))

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'

const mockExistsSync = vi.mocked(existsSync)
const mockWriteFileSync = vi.mocked(writeFileSync)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOpenCodePluginsDir', () => {
  it('returns plugins dir under home', () => {
    expect(getOpenCodePluginsDir()).toBe('/mock/home/.config/opencode/plugins')
  })
})

describe('getOpenCodePluginPath', () => {
  it('returns plugin file path', () => {
    expect(getOpenCodePluginPath()).toBe('/mock/home/.config/opencode/plugins/dota2-sounds.js')
  })
})

describe('isOpenCodeAvailable', () => {
  it('returns true when opencode dir exists', () => {
    mockExistsSync.mockReturnValue(true)
    expect(isOpenCodeAvailable()).toBe(true)
  })

  it('returns false when opencode dir is missing', () => {
    mockExistsSync.mockReturnValue(false)
    expect(isOpenCodeAvailable()).toBe(false)
  })
})

describe('installOpenCodePlugin', () => {
  it('creates plugins dir if missing', () => {
    mockExistsSync.mockReturnValue(false)

    installOpenCodePlugin()

    expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.config/opencode/plugins', {
      recursive: true,
    })
  })

  it('writes plugin file to correct path', () => {
    mockExistsSync.mockReturnValue(true)

    installOpenCodePlugin()

    expect(mockWriteFileSync).toHaveBeenCalledOnce()
    expect(mockWriteFileSync.mock.calls[0][0]).toBe(
      '/mock/home/.config/opencode/plugins/dota2-sounds.js',
    )
  })

  it('generated source contains SOUNDS_DIR', () => {
    mockExistsSync.mockReturnValue(true)

    installOpenCodePlugin()

    const source = String(mockWriteFileSync.mock.calls[0][1])
    expect(source).toContain('/mock/project/sounds')
  })

  it('generated source contains hero filtering', () => {
    mockExistsSync.mockReturnValue(true)

    installOpenCodePlugin()

    const source = String(mockWriteFileSync.mock.calls[0][1])
    expect(source).toContain('getConfiguredHeroes')
    expect(source).toContain('filterByHeroes')
  })

  it('generated source contains all event handlers', () => {
    mockExistsSync.mockReturnValue(true)

    installOpenCodePlugin()

    const source = String(mockWriteFileSync.mock.calls[0][1])
    expect(source).toContain('session.status')
    expect(source).toContain('session.error')
    expect(source).toContain('permission.asked')
    expect(source).toContain('session.created')
  })
})

describe('uninstallOpenCodePlugin', () => {
  it('deletes plugin file when it exists', () => {
    mockExistsSync.mockReturnValue(true)

    uninstallOpenCodePlugin()

    expect(unlinkSync).toHaveBeenCalledWith('/mock/home/.config/opencode/plugins/dota2-sounds.js')
  })

  it('does nothing when plugin file is missing', () => {
    mockExistsSync.mockReturnValue(false)

    uninstallOpenCodePlugin()

    expect(unlinkSync).not.toHaveBeenCalled()
  })
})
