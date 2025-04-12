import { Command } from 'commander';
import { parsePRD } from './prd-parser.js';
import { listTasks, generateTaskFiles, setTaskStatus, analyzeComplexity, expandTask } from './task-manager.js';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';

const program = new Command();

program
  .name('task-master')
  .description('AI-driven task management system')
  .version('1.0.0');

program
  .command('parse-prd')
  .description('Parse a PRD document and generate tasks')
  .option('-i, --input <file>', 'Input PRD file path', 'scripts/PRD.txt')
  .action(async (options) => {
    try {
      await parsePRD(options.input);
      console.log(chalk.green('✓ Tasks generated successfully from PRD'));
    } catch (error) {
      console.error(chalk.red('Error parsing PRD:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-w, --with-subtasks', 'Show subtasks')
  .action(async (options) => {
    try {
      await listTasks(options);
    } catch (error) {
      console.error(chalk.red('Error listing tasks:'), error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate individual task files')
  .action(async () => {
    try {
      await generateTaskFiles();
      console.log(chalk.green('✓ Task files generated successfully'));
    } catch (error) {
      console.error(chalk.red('Error generating task files:'), error.message);
      process.exit(1);
    }
  });

program
  .command('set-status')
  .description('Set task status')
  .requiredOption('-i, --id <id>', 'Task ID')
  .requiredOption('-s, --status <status>', 'New status')
  .action(async (options) => {
    try {
      await setTaskStatus(options.id, options.status);
      console.log(chalk.green(`✓ Task ${options.id} status updated to ${options.status}`));
    } catch (error) {
      console.error(chalk.red('Error setting task status:'), error.message);
      process.exit(1);
    }
  });

program
  .command('analyze-complexity')
  .description('Analyze task complexity and generate recommendations')
  .option('-t, --threshold <number>', 'Minimum complexity score for expansion (default: 5)', '5')
  .option('-o, --output <file>', 'Output file path', 'scripts/task-complexity-report.json')
  .action(async (options) => {
    try {
      await analyzeComplexity(options);
      console.log(chalk.green('✓ Complexity analysis completed'));
      console.log(chalk.blue('Report saved to:'), options.output);
    } catch (error) {
      console.error(chalk.red('Error analyzing complexity:'), error.message);
      process.exit(1);
    }
  });

program
  .command('expand')
  .description('Break down a task into subtasks')
  .requiredOption('-i, --id <id>', 'Task ID to expand')
  .option('-s, --subtasks <number>', 'Number of subtasks to create', '3')
  .option('-r, --research', 'Use research mode for better task breakdown')
  .option('-p, --prompt <text>', 'Additional context for task breakdown')
  .action(async (options) => {
    try {
      await expandTask(options);
      console.log(chalk.green('✓ Task expanded successfully'));
    } catch (error) {
      console.error(chalk.red('Error expanding task:'), error.message);
      process.exit(1);
    }
  });

export { program }; 