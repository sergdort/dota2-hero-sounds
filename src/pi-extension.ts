import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Get the path to the pi-extension directory in this project.
 * From dist/pi-extension.js -> ../pi-extension/
 */
export function getPiExtensionDir(): string {
  return join(__dirname, '..', 'pi-extension')
}

/**
 * Get the path to the installed extension (for display purposes).
 */
export function getPiExtensionPath(): string {
  return getPiExtensionDir()
}

/**
 * Check if Pi is installed.
 */
export function isPiAvailable(): boolean {
  return existsSync(join(homedir(), '.pi', 'agent'))
}

/**
 * Install the Pi extension using `pi install <path>`.
 * This installs the pi-extension/ directory as a proper Pi package.
 */
export function installPiExtension(extensionDirOverride?: string): void {
  const extensionDir = extensionDirOverride ?? getPiExtensionDir()
  try {
    execSync(`pi install "${extensionDir}"`, { stdio: 'pipe' })
  } catch {
    // Fallback: if `pi` CLI is not available, symlink directly
    const extensionsDir = join(homedir(), '.pi', 'agent', 'extensions')
    const targetDir = join(extensionsDir, 'dota2-sounds')
    mkdirSync(extensionsDir, { recursive: true })
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true })
    }
    symlinkSync(extensionDir, targetDir)
  }
}

/**
 * Remove the Pi extension using `pi remove`.
 */
export function uninstallPiExtension(): void {
  try {
    execSync(`pi remove "${getPiExtensionDir()}"`, { stdio: 'pipe' })
  } catch {
    // Fallback: remove symlink if it exists
    const targetDir = join(homedir(), '.pi', 'agent', 'extensions', 'dota2-sounds')
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true })
    }
  }
}
