#!/usr/bin/env node

/**
 * Standalone entry point for notification hooks and manual category playback.
 *
 * Hooks should call: node <path>/dist/play.js --event <semantic-event>
 * Backward compatibility: node <path>/dist/play.js <category>
 */

import { notifyEvent, playCategory } from './play-sound.js'

const [, , firstArg, secondArg] = process.argv

if (firstArg === '--event') {
  notifyEvent(secondArg ?? '')
} else {
  playCategory(firstArg ?? 'success')
}
