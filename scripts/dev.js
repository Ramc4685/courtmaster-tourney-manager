#!/usr/bin/env node

/**
 * dev.js
 * Task Master CLI - AI-driven development task management
 * 
 * This is the refactored entry point that uses the modular architecture.
 * It imports functionality from the modules directory and provides a CLI.
 */

// Add at the very beginning of the file
if (process.env.DEBUG === '1') {
  console.error('DEBUG - dev.js received args:', process.argv.slice(2));
}

import { program } from './modules/commands.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

// Load environment variables
dotenv.config();

// Display welcome message
console.log(
  gradient.pastel.multiline(
    figlet.textSync('Task Master', { horizontalLayout: 'full' })
  )
);

// Execute the command
program.parse(process.argv); 