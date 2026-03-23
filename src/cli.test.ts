import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs')>()
  return {
    ...original,
    existsSync: vi.fn(original.existsSync),
  }
})

// Mock all dependency modules
vi.mock('./claude-hooks.js', () => ({
  getClaudeSettingsPath: () => '/mock/.claude/settings.json',
  installClaudeHooks: vi.fn(),
  isClaudeCodeAvailable: vi.fn(() => false),
  uninstallClaudeHooks: vi.fn(),
}))

vi.mock('./opencode-plugin.js', () => ({
  getOpenCodePluginPath: () => '/mock/.config/opencode/plugins/dota2-sounds.js',
  installOpenCodePlugin: vi.fn(),
  isOpenCodeAvailable: vi.fn(() => false),
  uninstallOpenCodePlugin: vi.fn(),
}))

vi.mock('./pi-extension.js', () => ({
  getPiExtensionPath: () => '/mock/pi-extension',
  installPiExtension: vi.fn(),
  isPiAvailable: vi.fn(() => false),
  uninstallPiExtension: vi.fn(),
}))

vi.mock('./play-sound.js', () => ({
  CATEGORIES: ['success', 'error', 'attention', 'start'] as const,
  listSounds: vi.fn(() => ({
    success: ['success/Vo_axe_axe_kill_01.mp3'],
    error: ['error/Vo_axe_axe_respawn_01.mp3'],
    attention: ['attention/Vo_axe_axe_move_01.mp3'],
    start: ['start/Vo_axe_axe_spawn_01.mp3'],
  })),
  playSound: vi.fn(),
}))

vi.mock('./config.js', () => ({
  readConfig: vi.fn(() => ({ heroes: [] })),
  writeConfig: vi.fn(),
}))

vi.mock('./install-files.js', () => ({
  copyRuntimeFiles: vi.fn(),
  getInstalledPlayScript: vi.fn(() => '/mock/.config/dota2-sounds/dist/play.js'),
  getInstalledSoundsDir: vi.fn(() => '/mock/.config/dota2-sounds/sounds'),
  getInstalledPiExtensionDir: vi.fn(() => '/mock/.config/dota2-sounds/pi-extension'),
  removeRuntimeFiles: vi.fn(),
}))

vi.mock('./heroes.js', () => ({
  filterSoundsByHeroes: vi.fn((sounds: string[]) => sounds),
  getAvailableHeroes: vi.fn(() => [
    { key: 'axe', counts: { success: 5, error: 1, attention: 3, start: 2 }, total: 11 },
    { key: 'pudge', counts: { success: 2, error: 0, attention: 4, start: 1 }, total: 7 },
  ]),
}))

import { existsSync } from 'node:fs'
import { installClaudeHooks, isClaudeCodeAvailable, uninstallClaudeHooks } from './claude-hooks.js'
import { program } from './cli.js'
import { readConfig, writeConfig } from './config.js'
import { getAvailableHeroes } from './heroes.js'
import { getInstalledSoundsDir } from './install-files.js'

const mockExistsSync = vi.mocked(existsSync)
import {
  installOpenCodePlugin,
  isOpenCodeAvailable,
  uninstallOpenCodePlugin,
} from './opencode-plugin.js'
import { installPiExtension, isPiAvailable, uninstallPiExtension } from './pi-extension.js'
import { listSounds, playSound } from './play-sound.js'

let logOutput: string[]
let errorOutput: string[]

beforeEach(() => {
  vi.resetAllMocks()
  // Reset availability to false by default
  vi.mocked(isClaudeCodeAvailable).mockReturnValue(false)
  vi.mocked(isOpenCodeAvailable).mockReturnValue(false)
  vi.mocked(isPiAvailable).mockReturnValue(false)
  vi.mocked(readConfig).mockReturnValue({ heroes: [] })
  vi.mocked(playSound).mockImplementation(() => {})
  vi.mocked(listSounds).mockReturnValue({
    success: ['success/Vo_axe_axe_kill_01.mp3'],
    error: ['error/Vo_axe_axe_respawn_01.mp3'],
    attention: ['attention/Vo_axe_axe_move_01.mp3'],
    start: ['start/Vo_axe_axe_spawn_01.mp3'],
  })
  vi.mocked(getAvailableHeroes).mockReturnValue([
    { key: 'axe', counts: { success: 5, error: 1, attention: 3, start: 2 }, total: 11 },
    { key: 'pudge', counts: { success: 2, error: 0, attention: 4, start: 1 }, total: 7 },
  ])
  logOutput = []
  errorOutput = []
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    logOutput.push(args.join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    errorOutput.push(args.join(' '))
  })
  process.exitCode = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
})

function run(...args: string[]) {
  return program.parseAsync(['node', 'cli.js', ...args])
}

describe('install command', () => {
  it('installs claude hooks when --claude and available', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(true)

    await run('install', '--claude')

    expect(installClaudeHooks).toHaveBeenCalled()
    expect(logOutput.join('\n')).toContain('Claude Code hooks installed')
  })

  it('shows error when --claude but not available', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(false)

    await run('install', '--claude')

    expect(installClaudeHooks).not.toHaveBeenCalled()
    expect(errorOutput.join('\n')).toContain('Claude Code config directory')
  })

  it('installs opencode plugin when --opencode and available', async () => {
    vi.mocked(isOpenCodeAvailable).mockReturnValue(true)

    await run('install', '--opencode')

    expect(installOpenCodePlugin).toHaveBeenCalled()
    expect(logOutput.join('\n')).toContain('OpenCode plugin installed')
  })

  it('installs pi extension when --pi and available', async () => {
    vi.mocked(isPiAvailable).mockReturnValue(true)

    await run('install', '--pi')

    expect(installPiExtension).toHaveBeenCalled()
    expect(logOutput.join('\n')).toContain('Pi extension installed')
  })

  it('installs all available tools with --all', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(true)
    vi.mocked(isOpenCodeAvailable).mockReturnValue(true)
    vi.mocked(isPiAvailable).mockReturnValue(true)

    await run('install', '--all')

    expect(installClaudeHooks).toHaveBeenCalled()
    expect(installOpenCodePlugin).toHaveBeenCalled()
    expect(installPiExtension).toHaveBeenCalled()
  })

  it('shows error when no tools detected and no flags', async () => {
    await run('install')

    expect(logOutput.join('\n')).toContain('No supported tools detected')
    expect(process.exitCode).toBe(1)
  })

  it('auto-detects available tools', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(true)
    vi.mocked(isOpenCodeAvailable).mockReturnValue(false)
    vi.mocked(isPiAvailable).mockReturnValue(false)

    await run('install')

    expect(installClaudeHooks).toHaveBeenCalled()
    expect(installOpenCodePlugin).not.toHaveBeenCalled()
    expect(installPiExtension).not.toHaveBeenCalled()
  })
})

describe('uninstall command', () => {
  it('uninstalls all when no flags', async () => {
    await run('uninstall')

    expect(uninstallClaudeHooks).toHaveBeenCalled()
    expect(uninstallOpenCodePlugin).toHaveBeenCalled()
    expect(uninstallPiExtension).toHaveBeenCalled()
  })

  it('uninstalls only claude with --claude', async () => {
    await run('uninstall', '--claude')

    expect(uninstallClaudeHooks).toHaveBeenCalled()
    expect(uninstallOpenCodePlugin).not.toHaveBeenCalled()
    expect(uninstallPiExtension).not.toHaveBeenCalled()
  })

  it('uninstalls only opencode with --opencode', async () => {
    await run('uninstall', '--opencode')

    expect(uninstallOpenCodePlugin).toHaveBeenCalled()
    expect(uninstallClaudeHooks).not.toHaveBeenCalled()
  })

  it('uninstalls only pi with --pi', async () => {
    await run('uninstall', '--pi')

    expect(uninstallPiExtension).toHaveBeenCalled()
    expect(uninstallClaudeHooks).not.toHaveBeenCalled()
  })
})

describe('hero set', () => {
  it('writes config with valid heroes', async () => {
    await run('hero', 'set', 'axe', 'pudge')

    expect(writeConfig).toHaveBeenCalledWith({ heroes: ['axe', 'pudge'] })
    expect(logOutput.join('\n')).toContain('Heroes set: axe, pudge')
  })

  it('rejects unknown heroes', async () => {
    await run('hero', 'set', 'invalidhero')

    expect(writeConfig).not.toHaveBeenCalled()
    expect(errorOutput.join('\n')).toContain('Unknown hero(es): invalidhero')
    expect(process.exitCode).toBe(1)
  })
})

describe('hero show', () => {
  it('shows message when no heroes set', async () => {
    vi.mocked(readConfig).mockReturnValue({ heroes: [] })

    await run('hero', 'show')

    expect(logOutput.join('\n')).toContain('No hero preference set')
  })

  it('shows configured heroes', async () => {
    vi.mocked(readConfig).mockReturnValue({ heroes: ['axe', 'lina'] })

    await run('hero', 'show')

    expect(logOutput.join('\n')).toContain('Current heroes: axe, lina')
  })
})

describe('hero clear', () => {
  it('clears hero preference', async () => {
    await run('hero', 'clear')

    expect(writeConfig).toHaveBeenCalledWith({ heroes: [] })
    expect(logOutput.join('\n')).toContain('Hero preference cleared')
  })
})

describe('hero list', () => {
  it('shows heroes with counts', async () => {
    await run('hero', 'list')

    const output = logOutput.join('\n')
    expect(output).toContain('axe')
    expect(output).toContain('pudge')
    expect(output).toContain('Available Heroes')
  })

  it('marks selected heroes', async () => {
    vi.mocked(readConfig).mockReturnValue({ heroes: ['axe'] })

    await run('hero', 'list')

    const output = logOutput.join('\n')
    expect(output).toContain('axe *')
    expect(output).toContain('* = selected')
  })
})

describe('list command', () => {
  it('shows all sounds when no hero filter', async () => {
    await run('list')

    const output = logOutput.join('\n')
    expect(output).toContain('Dota 2 Sound Categories')
    expect(output).toContain('success:')
  })

  it('shows filter header when heroes configured', async () => {
    vi.mocked(readConfig).mockReturnValue({ heroes: ['axe'] })

    await run('list')

    expect(logOutput.join('\n')).toContain('filtered: axe')
  })
})

describe('test command', () => {
  it('plays sound for valid category', async () => {
    await run('test', 'success')

    expect(playSound).toHaveBeenCalledWith('success')
  })

  it('shows error for unknown category', async () => {
    await run('test', 'invalid')

    expect(playSound).not.toHaveBeenCalled()
    expect(errorOutput.join('\n')).toContain('Unknown category: invalid')
    expect(process.exitCode).toBe(1)
  })
})

describe('sounds show', () => {
  it('shows default dir when soundsDir matches installed', async () => {
    vi.mocked(readConfig).mockReturnValue({
      heroes: [],
      soundsDir: '/mock/.config/dota2-sounds/sounds',
    })

    await run('sounds', 'show')

    expect(logOutput.join('\n')).toContain('Sounds directory (default):')
  })

  it('shows custom dir when soundsDir differs from installed', async () => {
    vi.mocked(readConfig).mockReturnValue({
      heroes: [],
      soundsDir: '/custom/path/sounds',
    })

    await run('sounds', 'show')

    expect(logOutput.join('\n')).toContain('Custom sounds directory: /custom/path/sounds')
  })

  it('shows package default message when no soundsDir set', async () => {
    vi.mocked(readConfig).mockReturnValue({ heroes: [] })

    await run('sounds', 'show')

    expect(logOutput.join('\n')).toContain('No sounds directory set (using package default)')
  })
})

describe('sounds clear', () => {
  it('resets to installed default when it exists', async () => {
    mockExistsSync.mockReturnValue(true)

    await run('sounds', 'clear')

    expect(writeConfig).toHaveBeenCalledWith({ soundsDir: '/mock/.config/dota2-sounds/sounds' })
    expect(logOutput.join('\n')).toContain('Sounds directory reset to default:')
  })

  it('clears soundsDir when installed dir does not exist', async () => {
    mockExistsSync.mockReturnValue(false)

    await run('sounds', 'clear')

    expect(writeConfig).toHaveBeenCalledWith({ soundsDir: undefined })
    expect(logOutput.join('\n')).toContain('Custom sounds directory cleared')
  })
})

describe('install persists soundsDir', () => {
  it('writes soundsDir when not already set', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(true)
    vi.mocked(readConfig).mockReturnValue({ heroes: [] })

    await run('install', '--claude')

    expect(writeConfig).toHaveBeenCalledWith({
      soundsDir: '/mock/.config/dota2-sounds/sounds',
    })
  })

  it('does not overwrite existing soundsDir', async () => {
    vi.mocked(isClaudeCodeAvailable).mockReturnValue(true)
    vi.mocked(readConfig).mockReturnValue({
      heroes: [],
      soundsDir: '/custom/sounds',
    })

    await run('install', '--claude')

    expect(writeConfig).not.toHaveBeenCalledWith(
      expect.objectContaining({ soundsDir: expect.any(String) }),
    )
  })
})
