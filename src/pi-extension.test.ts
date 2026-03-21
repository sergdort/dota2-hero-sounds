import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  symlinkSync: vi.fn(),
}))

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import {
  getPiExtensionDir,
  getPiExtensionPath,
  installPiExtension,
  isPiAvailable,
  uninstallPiExtension,
} from './pi-extension.js'

const mockExistsSync = vi.mocked(existsSync)
const mockExecSync = vi.mocked(execSync)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPiExtensionDir', () => {
  it('returns a path ending in pi-extension', () => {
    expect(getPiExtensionDir()).toMatch(/pi-extension$/)
  })
})

describe('getPiExtensionPath', () => {
  it('returns same as getPiExtensionDir', () => {
    expect(getPiExtensionPath()).toBe(getPiExtensionDir())
  })
})

describe('isPiAvailable', () => {
  it('returns true when .pi/agent exists', () => {
    mockExistsSync.mockReturnValue(true)
    expect(isPiAvailable()).toBe(true)
  })

  it('returns false when .pi/agent is missing', () => {
    mockExistsSync.mockReturnValue(false)
    expect(isPiAvailable()).toBe(false)
  })
})

describe('installPiExtension', () => {
  it('calls pi install with extension dir', () => {
    mockExecSync.mockReturnValue(Buffer.from(''))

    installPiExtension()

    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('pi install'), {
      stdio: 'pipe',
    })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('pi-extension'), {
      stdio: 'pipe',
    })
  })

  it('falls back to symlink when pi CLI throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('pi not found')
    })
    mockExistsSync.mockReturnValue(false)

    installPiExtension()

    expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.pi/agent/extensions', { recursive: true })
    expect(symlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('pi-extension'),
      '/mock/home/.pi/agent/extensions/dota2-sounds',
    )
  })

  it('removes existing target before creating symlink', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('pi not found')
    })
    mockExistsSync.mockReturnValue(true)

    installPiExtension()

    expect(rmSync).toHaveBeenCalledWith('/mock/home/.pi/agent/extensions/dota2-sounds', {
      recursive: true,
    })
    expect(symlinkSync).toHaveBeenCalled()
  })
})

describe('uninstallPiExtension', () => {
  it('calls pi remove with extension dir', () => {
    mockExecSync.mockReturnValue(Buffer.from(''))

    uninstallPiExtension()

    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('pi remove'), {
      stdio: 'pipe',
    })
  })

  it('falls back to rmSync when pi CLI throws and target exists', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('pi not found')
    })
    mockExistsSync.mockReturnValue(true)

    uninstallPiExtension()

    expect(rmSync).toHaveBeenCalledWith('/mock/home/.pi/agent/extensions/dota2-sounds', {
      recursive: true,
    })
  })

  it('does nothing when pi CLI throws and target is missing', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('pi not found')
    })
    mockExistsSync.mockReturnValue(false)

    uninstallPiExtension()

    expect(rmSync).not.toHaveBeenCalled()
  })
})
