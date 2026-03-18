import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Sound categories mapping Dota 2 hero voice lines to event types.
 * Paths are relative to the sounds/ directory (e.g. "success/good-work.mp3").
 */
export const SOUND_CATEGORIES: Record<string, string[]> = {
  success: [
    "success/good-work.mp3",              // "Good work!"
    "success/nice-thanks.mp3",            // "Nice! Thanks!"
    "success/dont-mind-if-i-do.mp3",      // "Don't mind if I do!"
    "success/a-slice-of-the-action.mp3",  // "A slice of the action!"
    "success/a-gift-from-the-earth.mp3",  // "A gift from the Earth."
    "success/all-mine.mp3",               // "All mine!"
    "success/axe-actly.mp3",              // "Axe-actly!"
    "success/i-am-greatly-moved.mp3",     // "I am greatly moved."
    "success/ill-take-that.mp3",          // "I'll take that!"
    "success/what-happened-axe-happened.mp3", // "What happened? Axe happened!"
  ],
  error: [
    "error/defeated.mp3",               // "Now we're on the other side."
    "error/all-your-fault.mp3",         // "This is all your fault!"
    "error/all-fall-down.mp3",          // "All fall down."
    "error/bury-me-here.mp3",           // "Bury me here."
    "error/a-better-time-will-present-itself.mp3", // "A better time will present itself."
    "error/i-miss-my-gargoyle-friends-back-in-nishai.mp3", // "I miss my gargoyle friends..."
  ],
  attention: [
    "attention/hey-i-was-thinking.mp3",     // "Hey! I was thinking! Uh oh!"
    "attention/hey-wait-for-us.mp3",        // "Hey, wait for us!"
    "attention/after-you-no-me-first.mp3",  // "After you! No, me first!"
    "attention/be-still.mp3",               // "Be still."
  ],
  start: [
    "start/to-the-enemy.mp3",           // "TO THE ENEMY!"
    "start/yes-axe-kills-you.mp3",      // "Yes, Axe kills you!"
    "start/back-for-more.mp3",          // "Back for more!"
    "start/blink-dagger-now-its-on.mp3", // "Blink dagger. Now it's on."
    "start/i-quake-with-power.mp3",     // "I quake with power!"
  ],
};

/**
 * All available sound files across all categories.
 */
export const ALL_SOUNDS: string[] = Object.values(SOUND_CATEGORIES).flat();

/**
 * Resolve the absolute path to the sounds/ directory.
 * Works whether running from src/ (dev) or dist/ (built).
 */
export function getSoundsDir(): string {
  // From dist/play-sound.js → ../sounds/
  // From src/play-sound.ts → ../sounds/
  return join(__dirname, "..", "sounds");
}

/**
 * Pick a random element from an array.
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Play a sound from the given category.
 * Picks a random sound from the category, or from all sounds if category is unknown.
 * Fires and forgets — does not block.
 *
 * @param category - One of: success, error, attention, start
 */
export function playSound(category: string): void {
  const sounds = SOUND_CATEGORIES[category] ?? ALL_SOUNDS;
  const soundFile = randomPick(sounds);
  const soundPath = join(getSoundsDir(), soundFile);

  if (!existsSync(soundPath)) {
    process.stderr.write(`dota2-code-sounds: sound file not found: ${soundPath}\n`);
    return;
  }

  // Fire and forget — detached so it doesn't block the parent process
  const child = spawn("afplay", [soundPath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

/**
 * List all available categories and their sounds.
 */
export function listSounds(): Record<string, string[]> {
  return SOUND_CATEGORIES;
}
