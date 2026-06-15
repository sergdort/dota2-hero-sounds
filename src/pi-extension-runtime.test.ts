import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Pi extension runtime notification mapping', () => {
  const source = readFileSync(join(process.cwd(), 'pi-extension', 'index.ts'), 'utf-8')

  it('uses semantic notification events for supported Pi events', () => {
    expect(source).toContain("notifyEvent('session_start')")
    expect(source).toContain("notifyEvent('turn_complete')")
    expect(source).toContain("notifyEvent('error')")
    expect(source).toContain('NOTIFICATION_EVENTS')
    expect(source).toContain('config.muted === true')
    expect(source).toContain('config.enabledEvents')
  })

  it('does not map session shutdown to an error notification', () => {
    expect(source).not.toContain("pi.on('session_shutdown'")
    expect(source).not.toContain('session_shutdown')
  })
})
