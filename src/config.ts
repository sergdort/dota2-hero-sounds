import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export interface Config {
  heroes: string[]
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
    if (Array.isArray(parsed.heroes)) {
      return { heroes: parsed.heroes.filter((h: unknown) => typeof h === 'string') }
    }
    return { heroes: [] }
  } catch {
    return { heroes: [] }
  }
}

export function writeConfig(config: Config): void {
  const configPath = getConfigPath()
  const dir = dirname(configPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
}
