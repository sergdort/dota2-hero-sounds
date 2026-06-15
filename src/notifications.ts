import type { Config } from './config.js'
import type { Category } from './play-sound.js'

export const NOTIFICATION_EVENTS = [
  'session_start',
  'turn_complete',
  'needs_attention',
  'error',
] as const

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]

export const EVENT_DESCRIPTIONS: Record<NotificationEvent, string> = {
  session_start: 'Agent/session launched',
  turn_complete: 'Agent finished and is waiting for the next user input',
  needs_attention: 'Permission prompt or user action needed, where supported',
  error: 'Tool/session error',
}

export const EVENT_TO_CATEGORY: Record<NotificationEvent, Category> = {
  session_start: 'start',
  turn_complete: 'success',
  needs_attention: 'attention',
  error: 'error',
}

const EVENT_SET = new Set<string>(NOTIFICATION_EVENTS)

export function isNotificationEvent(event: string): event is NotificationEvent {
  return EVENT_SET.has(event)
}

export function normalizeEvents(events: readonly string[] | undefined): NotificationEvent[] {
  if (!events) return [...NOTIFICATION_EVENTS]
  const configured = new Set(events.filter(isNotificationEvent))
  return NOTIFICATION_EVENTS.filter((event) => configured.has(event))
}

export function getEnabledEvents(config: Pick<Config, 'enabledEvents'>): NotificationEvent[] {
  return normalizeEvents(config.enabledEvents)
}

export function isMuted(config: Pick<Config, 'muted'>): boolean {
  return config.muted === true
}

export function categoryForEvent(event: string): Category | undefined {
  if (!isNotificationEvent(event)) return undefined
  return EVENT_TO_CATEGORY[event]
}

export function shouldNotify(
  config: Pick<Config, 'enabledEvents' | 'muted'>,
  event: string,
): boolean {
  if (!isNotificationEvent(event)) return false
  if (isMuted(config)) return false
  return getEnabledEvents(config).includes(event)
}
