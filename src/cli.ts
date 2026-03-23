#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import {
  getClaudeSettingsPath,
  installClaudeHooks,
  isClaudeCodeAvailable,
  uninstallClaudeHooks,
} from './claude-hooks.js'
import { readConfig, writeConfig } from './config.js'
import { filterSoundsByHeroes, getAvailableHeroes } from './heroes.js'
import {
  copyRuntimeFiles,
  getInstalledPiExtensionDir,
  getInstalledPlayScript,
  getInstalledSoundsDir,
  removeRuntimeFiles,
} from './install-files.js'
import {
  getOpenCodePluginPath,
  installOpenCodePlugin,
  isOpenCodeAvailable,
  uninstallOpenCodePlugin,
} from './opencode-plugin.js'
import {
  getPiExtensionPath,
  installPiExtension,
  isPiAvailable,
  uninstallPiExtension,
} from './pi-extension.js'
import { CATEGORIES, listSounds, playSound } from './play-sound.js'

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Program ──────────────────────────────────────────────────────────

const program = new Command()

program
  .name('dota2-hero-sounds')
  .description('Dota 2 hero voice notifications for Claude Code, OpenCode, and Pi')
  .version('1.1.1')

// ── install ──────────────────────────────────────────────────────────

program
  .command('install')
  .description('Install hooks/plugins for detected tools')
  .option('--claude', 'Install Claude Code hooks only')
  .option('--opencode', 'Install OpenCode plugin only')
  .option('--pi', 'Install Pi coding agent extension only')
  .option('--all', 'Install for all supported tools')
  .action(async (opts: { claude?: boolean; opencode?: boolean; pi?: boolean; all?: boolean }) => {
    const wantClaude = opts.claude || opts.all
    const wantOpenCode = opts.opencode || opts.all
    const wantPi = opts.pi || opts.all
    const autoDetect = !wantClaude && !wantOpenCode && !wantPi

    let installedAny = false

    // Copy runtime files to permanent location first
    copyRuntimeFiles()
    const playScriptPath = getInstalledPlayScript()
    const soundsDir = getInstalledSoundsDir()

    // Persist default sounds dir so users can see where sounds are loaded from
    const currentConfig = readConfig()
    if (!currentConfig.soundsDir) {
      writeConfig({ soundsDir })
    }

    // Claude Code
    const claudeAvailable = isClaudeCodeAvailable()
    const shouldInstallClaude = wantClaude || (autoDetect && claudeAvailable)

    if (shouldInstallClaude) {
      if (!claudeAvailable) {
        console.error(
          'Error: Claude Code config directory (~/.claude/) not found. Is Claude Code installed?',
        )
      } else {
        installClaudeHooks(playScriptPath)
        console.log('[+] Claude Code hooks installed')
        console.log(`    Config: ${getClaudeSettingsPath()}`)
        installedAny = true
      }
    }

    // OpenCode
    const openCodeAvailable = isOpenCodeAvailable()
    const shouldInstallOpenCode = wantOpenCode || (autoDetect && openCodeAvailable)

    if (shouldInstallOpenCode) {
      if (!openCodeAvailable) {
        console.error(
          'Error: OpenCode config directory (~/.config/opencode/) not found. Is OpenCode installed?',
        )
      } else {
        installOpenCodePlugin(soundsDir)
        console.log('[+] OpenCode plugin installed')
        console.log(`    Plugin: ${getOpenCodePluginPath()}`)
        installedAny = true
      }
    }

    // Pi
    const piAvailable = isPiAvailable()
    const shouldInstallPi = wantPi || (autoDetect && piAvailable)

    if (shouldInstallPi) {
      if (!piAvailable) {
        console.error('Error: Pi config directory (~/.pi/agent/) not found. Is Pi installed?')
      } else {
        installPiExtension(getInstalledPiExtensionDir())
        console.log('[+] Pi extension installed')
        console.log(`    Extension: ${getPiExtensionPath()}`)
        installedAny = true
      }
    }

    if (!installedAny) {
      console.log(
        'No supported tools detected. Use --claude, --opencode, or --pi to force install.',
      )
      console.log('')
      console.log('Supported tools:')
      console.log('  Claude Code  (~/.claude/)')
      console.log('  OpenCode     (~/.config/opencode/)')
      console.log('  Pi           (~/.pi/agent/)')
      process.exitCode = 1
      return
    }

    console.log('')
    console.log(`Sounds: ${soundsDir}`)
    console.log(
      'Note: Adding custom sounds? Use `dota2-hero-sounds sounds set <path>` to point to your',
    )
    console.log(
      '      own directory — files in the default sounds dir are overwritten on reinstall.',
    )
    console.log('')
    console.log('Dota 2 Axe is ready. Good luck, have fun!')
  })

// ── uninstall ────────────────────────────────────────────────────────

program
  .command('uninstall')
  .description('Remove all hooks and plugins')
  .option('--claude', 'Remove Claude Code hooks only')
  .option('--opencode', 'Remove OpenCode plugin only')
  .option('--pi', 'Remove Pi extension only')
  .action((opts: { claude?: boolean; opencode?: boolean; pi?: boolean }) => {
    const removeAll = !opts.claude && !opts.opencode && !opts.pi

    if (removeAll || opts.claude) {
      uninstallClaudeHooks()
      console.log('[-] Claude Code hooks removed')
    }

    if (removeAll || opts.opencode) {
      uninstallOpenCodePlugin()
      console.log('[-] OpenCode plugin removed')
    }

    if (removeAll || opts.pi) {
      uninstallPiExtension()
      console.log('[-] Pi extension removed')
    }

    if (removeAll) {
      removeRuntimeFiles()
      console.log('[-] Runtime files removed')
    }

    console.log('')
    console.log('Axe is not Axe! (sounds removed)')
  })

// ── test ─────────────────────────────────────────────────────────────

program
  .command('test')
  .description('Play one sound from each category')
  .argument('[category]', 'Play a specific category only')
  .action(async (category?: string) => {
    if (category) {
      if (!listSounds()[category]) {
        console.error(`Unknown category: ${category}`)
        console.error(`Available: ${[...CATEGORIES].join(', ')}`)
        process.exitCode = 1
        return
      }
      console.log(`Playing: ${category}`)
      playSound(category)
      return
    }

    console.log('Testing all sound categories...\n')
    for (const cat of [...CATEGORIES]) {
      console.log(`  Playing: ${cat}`)
      playSound(cat)
      await sleep(2000)
    }
    console.log('\nDone. If you heard Axe, everything is working.')
  })

// ── list ─────────────────────────────────────────────────────────────

program
  .command('list')
  .description('Show all available sounds by category')
  .action(() => {
    const config = readConfig()
    const allSounds = listSounds()

    if (config.heroes.length > 0) {
      console.log(`Dota 2 Sound Categories (filtered: ${config.heroes.join(', ')})\n`)
    } else {
      console.log('Dota 2 Sound Categories\n')
    }

    for (const [cat, sounds] of Object.entries(allSounds)) {
      const filtered =
        config.heroes.length > 0 ? filterSoundsByHeroes(sounds, config.heroes) : sounds
      console.log(`  ${cat}: (${filtered.length} sounds)`)
      for (const sound of filtered) {
        const name = sound.replace(/^.*\//, '').replace('.mp3', '')
        console.log(`    - ${name}`)
      }
      console.log('')
    }
  })

// ── hero ─────────────────────────────────────────────────────────────

const hero = program.command('hero').description('Manage hero preferences')

hero
  .command('set')
  .description('Set preferred heroes')
  .argument('<heroes...>', 'Hero keys (e.g., axe pudge lina)')
  .action((heroes: string[]) => {
    const available = getAvailableHeroes()
    const validKeys = new Set(available.map((h) => h.key))
    const invalid = heroes.filter((h) => !validKeys.has(h))

    if (invalid.length > 0) {
      console.error(`Unknown hero(es): ${invalid.join(', ')}`)
      console.error(`Run 'dota2-hero-sounds hero list' to see available heroes`)
      process.exitCode = 1
      return
    }

    writeConfig({ heroes })
    console.log(`Heroes set: ${heroes.join(', ')}`)
  })

hero
  .command('list')
  .description('Show available heroes with sound counts')
  .action(() => {
    const heroes = getAvailableHeroes()
    const config = readConfig()
    const selected = new Set(config.heroes)

    console.log('Available Heroes\n')
    console.log(
      `  ${'Hero'.padEnd(20)} ${'Success'.padEnd(9)} ${'Error'.padEnd(9)} ${'Attention'.padEnd(11)} ${'Start'.padEnd(9)} Total`,
    )
    console.log(
      `  ${'─'.repeat(20)} ${'─'.repeat(9)} ${'─'.repeat(9)} ${'─'.repeat(11)} ${'─'.repeat(9)} ${'─'.repeat(5)}`,
    )

    for (const h of heroes) {
      const marker = selected.has(h.key) ? ' *' : ''
      console.log(
        `  ${(h.key + marker).padEnd(20)} ${String(h.counts.success).padEnd(9)} ${String(h.counts.error).padEnd(9)} ${String(h.counts.attention).padEnd(11)} ${String(h.counts.start).padEnd(9)} ${h.total}`,
      )
    }

    if (selected.size > 0) {
      console.log(`\n  * = selected`)
    }
  })

hero
  .command('show')
  .description('Show current hero preference')
  .action(() => {
    const config = readConfig()
    if (config.heroes.length === 0) {
      console.log('No hero preference set (using all heroes)')
    } else {
      console.log(`Current heroes: ${config.heroes.join(', ')}`)
    }
  })

hero
  .command('clear')
  .description('Clear hero preference (use all heroes)')
  .action(() => {
    writeConfig({ heroes: [] })
    console.log('Hero preference cleared (using all heroes)')
  })

// ── sounds ──────────────────────────────────────────────────────────

const sounds = program.command('sounds').description('Manage custom sounds directory')

sounds
  .command('set')
  .description('Set custom sounds directory (replaces default sounds)')
  .argument('<path>', 'Absolute or relative path to sounds directory')
  .action((dirPath: string) => {
    const resolved = resolve(dirPath)

    if (!existsSync(resolved)) {
      console.error(`Error: Directory does not exist: ${resolved}`)
      process.exitCode = 1
      return
    }

    const missing = [...CATEGORIES].filter((cat) => !existsSync(`${resolved}/${cat}`))
    if (missing.length > 0) {
      console.error(`Error: Missing category subdirectories: ${missing.join(', ')}`)
      console.error(
        `Expected: ${[...CATEGORIES].map((c) => `${c}/`).join(', ')} inside ${resolved}`,
      )
      process.exitCode = 1
      return
    }

    writeConfig({ soundsDir: resolved })
    console.log(`Custom sounds directory set: ${resolved}`)
  })

sounds
  .command('show')
  .description('Show current sounds directory')
  .action(() => {
    const config = readConfig()
    const defaultDir = getInstalledSoundsDir()
    if (config.soundsDir && config.soundsDir !== defaultDir) {
      console.log(`Custom sounds directory: ${config.soundsDir}`)
    } else if (config.soundsDir) {
      console.log(`Sounds directory (default): ${config.soundsDir}`)
    } else {
      console.log('No sounds directory set (using package default)')
    }
  })

sounds
  .command('clear')
  .description('Clear custom sounds directory (use default sounds)')
  .action(() => {
    const defaultDir = getInstalledSoundsDir()
    if (existsSync(defaultDir)) {
      writeConfig({ soundsDir: defaultDir })
      console.log(`Sounds directory reset to default: ${defaultDir}`)
    } else {
      writeConfig({ soundsDir: undefined })
      console.log('Custom sounds directory cleared (using default)')
    }
  })

// ── parse ────────────────────────────────────────────────────────────

export { program }

if (!process.env['VITEST']) {
  program.parse()
}
