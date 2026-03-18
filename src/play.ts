#!/usr/bin/env node

/**
 * Standalone entry point for playing a sound by category.
 * Called by hooks: node <path>/dist/play.js <category>
 */

import { playSound } from "./play-sound.js";

const category = process.argv[2] ?? "success";
playSound(category);
