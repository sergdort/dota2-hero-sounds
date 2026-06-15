import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export interface Config {
  heroes: string[]
  soundsDir?: string
  muted?: boolean
  enabledEvents?: string[]
}

export function getConfigPath(): string {
  return join(homedir(), '.config', 'dota2-sounds', 'config.json')
}

export function readConfig(): Config {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    return { heroes: [] }
  }
  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    const config: Config = {
      heroes: Array.isArray(parsed.heroes)
        ? parsed.heroes.filter((h: unknown) => typeof h === 'string')
        : [],
    }
    if (typeof parsed.soundsDir === 'string' && parsed.soundsDir) {
      config.soundsDir = parsed.soundsDir
    }
    if (typeof parsed.muted === 'boolean') {
      config.muted = parsed.muted
    }
    if (Array.isArray(parsed.enabledEvents)) {
      config.enabledEvents = parsed.enabledEvents.filter((e: unknown) => typeof e === 'string')
    }
    return config
  } catch {
    return { heroes: [] }
  }
}

export function writeConfig(partial: Partial<Config>): void {
  const configPath = getConfigPath()
  const dir = dirname(configPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const existing = readConfig()
  const merged = { ...existing, ...partial }
  // Remove undefined values so cleared fields are deleted from JSON
  const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined))
  writeFileSync(configPath, `${JSON.stringify(clean, null, 2)}\n`, 'utf-8')
}
