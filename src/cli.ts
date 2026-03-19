#!/usr/bin/env node

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import {
  getClaudeSettingsPath,
  installClaudeHooks,
  isClaudeCodeAvailable,
  uninstallClaudeHooks,
} from './claude-hooks.js'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PLAY_SCRIPT_PATH = join(__dirname, 'play.js')

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Program ──────────────────────────────────────────────────────────

const program = new Command()

program
  .name('dota2-code-sounds')
  .description('Dota 2 hero voice notifications for Claude Code, OpenCode, and Pi')
  .version('26.3.18')

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

    // Claude Code
    const claudeAvailable = isClaudeCodeAvailable()
    const shouldInstallClaude = wantClaude || (autoDetect && claudeAvailable)

    if (shouldInstallClaude) {
      if (!claudeAvailable) {
        console.error(
          'Error: Claude Code config directory (~/.claude/) not found. Is Claude Code installed?',
        )
      } else {
        installClaudeHooks(PLAY_SCRIPT_PATH)
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
        installOpenCodePlugin()
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
        installPiExtension()
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
    console.log('Dota 2 Sound Categories\n')
    for (const [cat, sounds] of Object.entries(listSounds())) {
      console.log(`  ${cat}:`)
      for (const sound of sounds) {
        const name = sound.replace(/^.*\//, '').replace('.mp3', '')
        console.log(`    - ${name}`)
      }
      console.log('')
    }
  })

// ── parse ────────────────────────────────────────────────────────────

program.parse()
