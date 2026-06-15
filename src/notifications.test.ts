import { describe, expect, it } from 'vitest'
import {
  categoryForEvent,
  getEnabledEvents,
  normalizeEvents,
  shouldNotify,
} from './notifications.js'

describe('notification policy', () => {
  it('treats missing enabledEvents as all v1 events enabled', () => {
    expect(getEnabledEvents({})).toEqual([
      'session_start',
      'turn_complete',
      'needs_attention',
      'error',
    ])
  })

  it('normalizes enabled events in canonical order and ignores unknown events', () => {
    expect(normalizeEvents(['error', 'unknown', 'session_start', 'error'])).toEqual([
      'session_start',
      'error',
    ])
  })

  it('allows known enabled events when unmuted', () => {
    expect(shouldNotify({ enabledEvents: ['error'], muted: false }, 'error')).toBe(true)
  })

  it('suppresses notifications when muted', () => {
    expect(shouldNotify({ muted: true }, 'error')).toBe(false)
  })

  it('suppresses disabled or unknown events', () => {
    expect(shouldNotify({ enabledEvents: ['error'] }, 'turn_complete')).toBe(false)
    expect(shouldNotify({ enabledEvents: ['error'] }, 'unknown')).toBe(false)
  })

  it('maps events to sound categories', () => {
    expect(categoryForEvent('session_start')).toBe('start')
    expect(categoryForEvent('turn_complete')).toBe('success')
    expect(categoryForEvent('needs_attention')).toBe('attention')
    expect(categoryForEvent('error')).toBe('error')
    expect(categoryForEvent('unknown')).toBeUndefined()
  })
})
