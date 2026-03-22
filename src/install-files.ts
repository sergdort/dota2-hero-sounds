import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Root of the permanent install location.
 */
export function getInstallDir(): string {
  return join(homedir(), '.config', 'dota2-sounds')
}

/**
 * Path to the permanently installed play.js script.
 */
export function getInstalledPlayScript(): string {
  return join(getInstallDir(), 'dist', 'play.js')
}

/**
 * Path to the permanently installed sounds directory.
 */
export function getInstalledSoundsDir(): string {
  return join(getInstallDir(), 'sounds')
}

/**
 * Path to the permanently installed pi-extension directory.
 */
export function getInstalledPiExtensionDir(): string {
  return join(getInstallDir(), 'pi-extension')
}

/**
 * Copy runtime files (dist JS + sounds + pi-extension) to ~/.config/dota2-sounds/.
 * This ensures hooks point to a permanent location that survives npx cache cleanup.
 */
export function copyRuntimeFiles(): void {
  const installDir = getInstallDir()
  const targetDist = join(installDir, 'dist')
  const targetSounds = join(installDir, 'sounds')
  const targetPiExt = join(installDir, 'pi-extension')

  // Source paths (relative to dist/ where this compiled JS lives)
  const sourceDist = __dirname
  const sourceSounds = join(__dirname, '..', 'sounds')
  const sourcePiExt = join(__dirname, '..', 'pi-extension')

  // Create install dir
  mkdirSync(installDir, { recursive: true })

  // Copy dist JS files (play.js, play-sound.js, config.js, heroes.js)
  const jsFiles = ['play.js', 'play-sound.js', 'config.js', 'heroes.js']
  mkdirSync(targetDist, { recursive: true })
  for (const file of jsFiles) {
    const src = join(sourceDist, file)
    const dest = join(targetDist, file)
    if (existsSync(src)) {
      cpSync(src, dest)
    }
  }

  // Copy sounds directory (overwrite existing)
  if (existsSync(sourceSounds)) {
    cpSync(sourceSounds, targetSounds, { recursive: true })
  }

  // Copy pi-extension directory
  if (existsSync(sourcePiExt)) {
    cpSync(sourcePiExt, targetPiExt, { recursive: true })
  }
}

/**
 * Remove permanently installed runtime files.
 * Keeps config.json (hero preferences) intact.
 */
export function removeRuntimeFiles(): void {
  const installDir = getInstallDir()
  const targetDist = join(installDir, 'dist')
  const targetSounds = join(installDir, 'sounds')
  const targetPiExt = join(installDir, 'pi-extension')

  if (existsSync(targetDist)) {
    rmSync(targetDist, { recursive: true })
  }
  if (existsSync(targetSounds)) {
    rmSync(targetSounds, { recursive: true })
  }
  if (existsSync(targetPiExt)) {
    rmSync(targetPiExt, { recursive: true })
  }
}
