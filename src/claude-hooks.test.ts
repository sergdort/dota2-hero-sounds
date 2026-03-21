import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getClaudeSettingsPath,
  installClaudeHooks,
  isClaudeCodeAvailable,
  uninstallClaudeHooks,
} from './claude-hooks.js'

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

describe('getClaudeSettingsPath', () => {
  it('returns path under home directory', () => {
    expect(getClaudeSettingsPath()).toBe('/mock/home/.claude/settings.json')
  })
})

describe('isClaudeCodeAvailable', () => {
  it('returns true when .claude directory exists', () => {
    mockExistsSync.mockReturnValue(true)
    expect(isClaudeCodeAvailable()).toBe(true)
  })

  it('returns false when .claude directory is missing', () => {
    mockExistsSync.mockReturnValue(false)
    expect(isClaudeCodeAvailable()).toBe(false)
  })
})

describe('installClaudeHooks', () => {
  it('creates hooks in empty settings', () => {
    mockExistsSync.mockImplementation((p) => {
      if (String(p).endsWith('.claude')) return true
      return false // settings.json doesn't exist
    })

    installClaudeHooks('/path/to/play.js')

    expect(mockWriteFileSync).toHaveBeenCalledOnce()
    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())

    expect(written.hooks).toBeDefined()
    expect(Object.keys(written.hooks)).toEqual(
      expect.arrayContaining(['Stop', 'PostToolUseFailure', 'Notification', 'SessionStart']),
    )

    // Each event has one hook entry with our marker
    for (const event of ['Stop', 'PostToolUseFailure', 'Notification', 'SessionStart']) {
      expect(written.hooks[event]).toHaveLength(1)
      expect(written.hooks[event][0].hooks[0].command).toContain('dota2-code-sounds')
      expect(written.hooks[event][0].hooks[0].command).toContain('/path/to/play.js')
    }
  })

  it('preserves existing user hooks', () => {
    const existingSettings = {
      hooks: {
        Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'echo user-hook' }] }],
      },
    }
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify(existingSettings))

    installClaudeHooks('/path/to/play.js')

    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())
    // Should have the user hook + our hook
    expect(written.hooks.Stop).toHaveLength(2)
    expect(written.hooks.Stop[0].hooks[0].command).toBe('echo user-hook')
    expect(written.hooks.Stop[1].hooks[0].command).toContain('dota2-code-sounds')
  })

  it('replaces existing dota2 hooks on reinstall', () => {
    const existingSettings = {
      hooks: {
        Stop: [
          {
            matcher: '',
            hooks: [{ type: 'command', command: 'node old/play.js success # dota2-code-sounds' }],
          },
        ],
      },
    }
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify(existingSettings))

    installClaudeHooks('/new/path/play.js')

    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())
    // Should have exactly one hook (replaced, not duplicated)
    expect(written.hooks.Stop).toHaveLength(1)
    expect(written.hooks.Stop[0].hooks[0].command).toContain('/new/path/play.js')
  })

  it('creates directory if missing', () => {
    mockExistsSync.mockReturnValue(false)

    installClaudeHooks('/path/to/play.js')

    expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.claude', { recursive: true })
  })

  it('maps correct categories to events', () => {
    mockExistsSync.mockImplementation((p) => {
      if (String(p).endsWith('.claude')) return true
      return false
    })

    installClaudeHooks('/path/to/play.js')

    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())
    expect(written.hooks.Stop[0].hooks[0].command).toContain('success')
    expect(written.hooks.PostToolUseFailure[0].hooks[0].command).toContain('error')
    expect(written.hooks.Notification[0].hooks[0].command).toContain('attention')
    expect(written.hooks.SessionStart[0].hooks[0].command).toContain('start')
  })
})

describe('uninstallClaudeHooks', () => {
  it('removes only dota2 hooks, preserves user hooks', () => {
    const settings = {
      hooks: {
        Stop: [
          { matcher: '', hooks: [{ type: 'command', command: 'echo user-hook' }] },
          {
            matcher: '',
            hooks: [{ type: 'command', command: 'node play.js success # dota2-code-sounds' }],
          },
        ],
      },
    }
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify(settings))

    uninstallClaudeHooks()

    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())
    expect(written.hooks.Stop).toHaveLength(1)
    expect(written.hooks.Stop[0].hooks[0].command).toBe('echo user-hook')
  })

  it('removes hooks key entirely when empty after uninstall', () => {
    const settings = {
      someOtherSetting: true,
      hooks: {
        Stop: [
          {
            matcher: '',
            hooks: [{ type: 'command', command: 'node play.js success # dota2-code-sounds' }],
          },
        ],
      },
    }
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify(settings))

    uninstallClaudeHooks()

    const written = JSON.parse(String(mockWriteFileSync.mock.calls[0][1]).trim())
    expect(written.hooks).toBeUndefined()
    expect(written.someOtherSetting).toBe(true)
  })

  it('does nothing when settings file is missing', () => {
    mockExistsSync.mockReturnValue(false)

    uninstallClaudeHooks()

    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('does nothing when settings has no hooks key', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ someOtherSetting: true }))

    uninstallClaudeHooks()

    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })
})
