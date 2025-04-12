import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';

async function loadTasks() {
  try {
    const tasksFile = path.join(process.cwd(), 'tasks', 'tasks.json');
    const content = await fs.readFile(tasksFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load tasks: ${error.message}`);
  }
}

async function saveTasks(tasksData) {
  try {
    const tasksFile = path.join(process.cwd(), 'tasks', 'tasks.json');
    await fs.writeFile(tasksFile, JSON.stringify(tasksData, null, 2));
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}

async function listTasks(options = {}) {
  try {
    const { tasks } = await loadTasks();
    const filteredTasks = options.status
      ? tasks.filter(task => task.status === options.status)
      : tasks;

    const table = new Table({
      head: ['ID', 'Title', 'Status', 'Priority', 'Dependencies'],
      style: { head: ['cyan'] }
    });

    filteredTasks.forEach(task => {
      table.push([
        task.id,
        task.title,
        formatStatus(task.status),
        formatPriority(task.priority),
        formatDependencies(task.dependencies)
      ]);

      if (options.withSubtasks && task.subtasks?.length) {
        task.subtasks.forEach(subtask => {
          table.push([
            `${task.id}.${subtask.id}`,
            `  └─ ${subtask.title}`,
            formatStatus(subtask.status),
            formatPriority(subtask.priority),
            ''
          ]);
        });
      }
    });

    console.log(table.toString());
  } catch (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }
}

async function generateTaskFiles() {
  try {
    const { tasks } = await loadTasks();
    const tasksDir = path.join(process.cwd(), 'tasks');
    
    // Create tasks directory if it doesn't exist
    await fs.mkdir(tasksDir, { recursive: true });

    for (const task of tasks) {
      const taskContent = generateTaskFileContent(task);
      const fileName = `task_${String(task.id).padStart(3, '0')}.txt`;
      await fs.writeFile(path.join(tasksDir, fileName), taskContent);
    }
  } catch (error) {
    throw new Error(`Failed to generate task files: ${error.message}`);
  }
}

async function setTaskStatus(taskId, status) {
  try {
    const tasksData = await loadTasks();
    const task = findTask(tasksData.tasks, taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    updateTaskStatus(task, status);
    
    if (status === 'done') {
      task.subtasks?.forEach(subtask => {
        subtask.status = 'done';
      });
    }

    await saveTasks(tasksData);
    await generateTaskFiles();
  } catch (error) {
    throw new Error(`Failed to set task status: ${error.message}`);
  }
}

function findTask(tasks, taskId) {
  const [parentId, subtaskId] = taskId.toString().split('.');
  const task = tasks.find(t => t.id === parseInt(parentId));
  
  if (!task) return null;
  if (!subtaskId) return task;
  
  return task.subtasks?.find(st => st.id === parseInt(subtaskId)) || null;
}

function updateTaskStatus(task, status) {
  const validStatuses = ['pending', 'in-progress', 'done', 'deferred'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
  }
  task.status = status;
}

function formatStatus(status) {
  const colors = {
    pending: 'yellow',
    'in-progress': 'blue',
    done: 'green',
    deferred: 'gray'
  };
  return chalk[colors[status] || 'white'](status);
}

function formatPriority(priority) {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'blue'
  };
  return chalk[colors[priority] || 'white'](priority);
}

function formatDependencies(dependencies) {
  if (!dependencies?.length) return '';
  return dependencies.join(', ');
}

function generateTaskFileContent(task) {
  return `# Task ID: ${task.id}
# Title: ${task.title}
# Status: ${task.status}
# Dependencies: ${task.dependencies.join(', ') || 'None'}
# Priority: ${task.priority}
# Description: ${task.description}

# Details:
${task.details}

# Test Strategy:
${task.testStrategy}

${task.subtasks?.length ? `# Subtasks:
${task.subtasks.map(st => `${st.id}. ${st.title} [${st.status}]`).join('\n')}` : ''}
`;
}

async function analyzeComplexity(options) {
  try {
    const { tasks } = await loadTasks();
    const complexityReport = {
      meta: {
        generatedAt: new Date().toISOString(),
        threshold: parseInt(options.threshold),
      },
      taskAnalysis: [],
      recommendations: []
    };

    // Analyze each task
    for (const task of tasks) {
      const analysis = analyzeTaskComplexity(task);
      complexityReport.taskAnalysis.push(analysis);

      // Generate recommendations for complex tasks
      if (analysis.complexityScore >= options.threshold) {
        complexityReport.recommendations.push(generateRecommendation(analysis));
      }
    }

    // Add summary statistics
    complexityReport.summary = generateComplexitySummary(complexityReport.taskAnalysis);

    // Save the report
    await fs.writeFile(options.output, JSON.stringify(complexityReport, null, 2));

    // Display summary
    displayComplexityAnalysis(complexityReport);

    return complexityReport;
  } catch (error) {
    throw new Error(`Failed to analyze complexity: ${error.message}`);
  }
}

function analyzeTaskComplexity(task) {
  let complexityScore = 0;
  const factors = [];

  // Base complexity factors
  if (task.priority === 'high') complexityScore += 2;
  if (task.dependencies.length > 0) {
    complexityScore += Math.min(task.dependencies.length, 3);
    factors.push(`Has ${task.dependencies.length} dependencies`);
  }

  // Subtask complexity
  if (task.subtasks?.length) {
    complexityScore += Math.min(task.subtasks.length, 3);
    factors.push(`Contains ${task.subtasks.length} subtasks`);
  }

  // Technical complexity indicators in title/description
  const technicalTerms = ['authentication', 'real-time', 'integration', 'automated', 'sync', 'offline'];
  const foundTerms = technicalTerms.filter(term => 
    task.title.toLowerCase().includes(term) || 
    task.description.toLowerCase().includes(term)
  );
  if (foundTerms.length > 0) {
    complexityScore += foundTerms.length;
    factors.push(`Contains technical terms: ${foundTerms.join(', ')}`);
  }

  // User interaction complexity
  const userTerms = ['user', 'interface', 'display', 'input', 'notification'];
  const foundUserTerms = userTerms.filter(term =>
    task.title.toLowerCase().includes(term) ||
    task.description.toLowerCase().includes(term)
  );
  if (foundUserTerms.length > 0) {
    complexityScore += foundUserTerms.length;
    factors.push(`Contains user interaction terms: ${foundUserTerms.join(', ')}`);
  }

  return {
    taskId: task.id,
    title: task.title,
    complexityScore,
    factors,
    recommendedSubtasks: Math.max(2, Math.min(Math.ceil(complexityScore / 2), 5))
  };
}

function generateRecommendation(analysis) {
  return {
    taskId: analysis.taskId,
    title: analysis.title,
    message: `Task ${analysis.taskId} (${analysis.title}) has high complexity (score: ${analysis.complexityScore})`,
    factors: analysis.factors,
    suggestedAction: `Consider breaking down into ${analysis.recommendedSubtasks} subtasks`,
    command: `node scripts/dev.js expand --id=${analysis.taskId} --subtasks=${analysis.recommendedSubtasks}`
  };
}

function generateComplexitySummary(analyses) {
  const scores = analyses.map(a => a.complexityScore);
  return {
    totalTasks: analyses.length,
    averageComplexity: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
    maxComplexity: Math.max(...scores),
    minComplexity: Math.min(...scores),
    complexityDistribution: {
      low: scores.filter(s => s < 5).length,
      medium: scores.filter(s => s >= 5 && s < 8).length,
      high: scores.filter(s => s >= 8).length
    }
  };
}

function displayComplexityAnalysis(report) {
  console.log('\nComplexity Analysis Summary:');
  console.log('---------------------------');
  console.log(`Total Tasks: ${report.summary.totalTasks}`);
  console.log(`Average Complexity: ${report.summary.averageComplexity}`);
  console.log(`Complexity Distribution:`);
  console.log(`  Low (0-4): ${report.summary.complexityDistribution.low} tasks`);
  console.log(`  Medium (5-7): ${report.summary.complexityDistribution.medium} tasks`);
  console.log(`  High (8+): ${report.summary.complexityDistribution.high} tasks`);

  if (report.recommendations.length > 0) {
    console.log('\nHigh Complexity Tasks:');
    console.log('--------------------');
    report.recommendations.forEach(rec => {
      console.log(chalk.yellow(`\n${rec.title} (Task ${rec.taskId})`));
      console.log(`Complexity Factors:`);
      rec.factors.forEach(f => console.log(`  - ${f}`));
      console.log(`Suggestion: ${rec.suggestedAction}`);
      console.log(`Run: ${chalk.blue(rec.command)}`);
    });
  }
}

async function expandTask(options) {
  try {
    const tasksData = await loadTasks();
    const task = findTask(tasksData.tasks, options.id);
    
    if (!task) {
      throw new Error(`Task ${options.id} not found`);
    }

    // Generate subtasks based on task type and context
    const subtasks = await generateSubtasks(task, parseInt(options.subtasks), options);
    
    // Update the task with new subtasks
    task.subtasks = subtasks.map((st, idx) => ({
      id: idx + 1,
      title: st.title,
      description: st.description,
      status: 'pending',
      priority: task.priority === 'high' ? 'medium' : 'low',
      details: st.details || '',
      testStrategy: st.testStrategy || `Verify ${st.title.toLowerCase()} functionality`
    }));

    // Save updated tasks
    await saveTasks(tasksData);
    await generateTaskFiles();

    return task;
  } catch (error) {
    throw new Error(`Failed to expand task: ${error.message}`);
  }
}

async function generateSubtasks(task, count, options) {
  // Define subtask templates based on task type
  const subtaskTemplates = {
    'Tournament Setup & Management': [
      { title: 'Division Configuration System', description: 'Implement system for managing tournament divisions including skill levels, age groups, and gender categories', details: 'Create UI and backend for division setup\nImplement validation rules\nAdd division modification capabilities' },
      { title: 'Tournament Format Engine', description: 'Build core engine for handling different tournament formats', details: 'Implement bracket generation\nAdd support for round robin\nCreate format validation system' },
      { title: 'Registration Management', description: 'Develop player and team registration system', details: 'Create registration forms\nImplement validation\nAdd team formation capabilities' },
      { title: 'Custom Format Builder', description: 'Create interface for building custom tournament formats', details: 'Design format builder UI\nImplement format validation\nAdd format preview capability' },
      { title: 'Tournament Configuration Dashboard', description: 'Build main dashboard for tournament setup and management', details: 'Create tournament setup wizard\nImplement configuration panels\nAdd tournament modification capabilities' }
    ],
    'Automated Court Management': [
      { title: 'Court Assignment Algorithm', description: 'Develop intelligent court assignment system', details: 'Implement assignment logic\nAdd priority handling\nCreate reallocation system' },
      { title: 'Real-time Court Monitor', description: 'Build real-time court status monitoring system', details: 'Create monitoring dashboard\nImplement status updates\nAdd alert system' },
      { title: 'Court Analytics Engine', description: 'Implement court utilization analytics', details: 'Create metrics calculation\nBuild reporting system\nAdd visualization components' },
      { title: 'Schedule Optimization System', description: 'Develop system for optimizing court schedules', details: 'Implement optimization algorithm\nAdd manual override capabilities\nCreate schedule visualization' },
      { title: 'Court Management Interface', description: 'Build interface for court configuration and management', details: 'Create court setup UI\nImplement maintenance scheduling\nAdd court status management' }
    ],
    'Digital Scoring System': [
      { title: 'Score Entry Interface', description: 'Create touch-friendly scoring interface', details: 'Design mobile-first UI\nImplement gesture controls\nAdd quick-entry features' },
      { title: 'Real-time Scoring Engine', description: 'Build real-time score synchronization system', details: 'Implement sync logic\nAdd conflict resolution\nCreate backup system' },
      { title: 'Offline Scoring Module', description: 'Implement offline scoring capabilities', details: 'Create offline storage\nImplement sync queue\nAdd conflict resolution' },
      { title: 'Score Verification System', description: 'Develop score verification and correction system', details: 'Create verification workflow\nImplement correction logging\nAdd approval system' },
      { title: 'Match Statistics Engine', description: 'Build system for tracking and analyzing match statistics', details: 'Define statistics model\nImplement calculation engine\nCreate visualization components' }
    ],
    'Player Experience': [
      { title: 'Player Portal', description: 'Create main player interface and dashboard', details: 'Design player dashboard\nImplement profile management\nAdd notification center' },
      { title: 'Match Schedule Manager', description: 'Build personal match schedule system', details: 'Create schedule view\nImplement notifications\nAdd calendar integration' },
      { title: 'Tournament Communication System', description: 'Develop tournament-wide communication platform', details: 'Implement chat system\nAdd announcement capabilities\nCreate moderation tools' },
      { title: 'Performance Analytics', description: 'Build player performance tracking system', details: 'Define metrics\nImplement tracking\nCreate visualization' },
      { title: 'Digital Check-in System', description: 'Implement digital check-in process', details: 'Create check-in UI\nAdd verification system\nImplement status tracking' }
    ]
  };

  // Get template based on task title or use generic breakdown
  const template = subtaskTemplates[task.title] || [];
  
  if (template.length > 0) {
    return template.slice(0, count);
  }

  // For tasks without templates, create generic subtasks
  return Array.from({ length: count }, (_, i) => ({
    title: `Subtask ${i + 1}`,
    description: `Implement part ${i + 1} of ${task.title}`,
    details: `Break down and implement functionality for ${task.title} - part ${i + 1}`
  }));
}

export { listTasks, generateTaskFiles, setTaskStatus, analyzeComplexity, expandTask }; 