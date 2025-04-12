import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function parsePRD(prdPath) {
  try {
    const prdContent = await fs.readFile(prdPath, 'utf-8');
    const tasks = [];
    let currentId = 1;

    // Parse Core Features
    const coreFeatures = extractSection(prdContent, '# Core Features', '# User Experience');
    const features = parseFeatures(coreFeatures);
    
    // Parse Technical Architecture
    const techArch = extractSection(prdContent, '# Technical Architecture', '# Development Roadmap');
    const techTasks = parseTechnicalArchitecture(techArch);
    
    // Parse Development Roadmap
    const roadmap = extractSection(prdContent, '# Development Roadmap', '# Logical Dependency Chain');
    const roadmapTasks = parseRoadmap(roadmap);

    // Combine all tasks
    tasks.push(...features.map(f => ({ ...f, id: currentId++ })));
    tasks.push(...techTasks.map(t => ({ ...t, id: currentId++ })));
    tasks.push(...roadmapTasks.map(r => ({ ...r, id: currentId++ })));

    // Set up dependencies based on Logical Dependency Chain
    const dependencyChain = extractSection(prdContent, '# Logical Dependency Chain', '# Risks and Mitigations');
    setupDependencies(tasks, dependencyChain);

    // Write tasks to tasks.json
    const tasksDir = path.join(process.cwd(), 'tasks');
    await fs.mkdir(tasksDir, { recursive: true });
    
    const tasksFile = path.join(tasksDir, 'tasks.json');
    await fs.writeFile(tasksFile, JSON.stringify({ 
      meta: {
        projectName: "CourtMaster",
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        source: prdPath
      },
      tasks 
    }, null, 2));

    return tasks;
  } catch (error) {
    throw new Error(`Failed to parse PRD: ${error.message}`);
  }
}

function extractSection(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1) return '';
  return content.slice(start + startMarker.length, end !== -1 ? end : undefined).trim();
}

function parseFeatures(featuresContent) {
  const features = [];
  const featureBlocks = featuresContent.split(/\d+\.\s+/).filter(Boolean);
  
  featureBlocks.forEach(block => {
    const lines = block.split('\n').filter(Boolean);
    const title = lines[0].trim();
    const subTasks = lines
      .slice(1)
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().slice(2));

    features.push({
      title,
      description: `Implement ${title.toLowerCase()}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      details: subTasks.join('\n'),
      testStrategy: `Verify all ${title.toLowerCase()} functionality works as specified`,
      subtasks: subTasks.map((task, idx) => ({
        id: idx + 1,
        title: task.trim(),
        status: 'pending',
        priority: 'medium',
        description: `Implement ${task.trim().toLowerCase()}`
      }))
    });
  });

  return features;
}

function parseTechnicalArchitecture(techContent) {
  const tasks = [];
  const components = techContent.split(/\d+\.\s+/).filter(Boolean);

  components.forEach(component => {
    const lines = component.split('\n').filter(Boolean);
    const title = lines[0].trim();
    const subTasks = lines
      .slice(1)
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().slice(2));

    tasks.push({
      title: `Set up ${title}`,
      description: `Implement and configure ${title.toLowerCase()}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      details: subTasks.join('\n'),
      testStrategy: `Verify ${title.toLowerCase()} setup and functionality`,
      subtasks: subTasks.map((task, idx) => ({
        id: idx + 1,
        title: task.trim(),
        status: 'pending',
        priority: 'medium',
        description: `Implement ${task.trim().toLowerCase()}`
      }))
    });
  });

  return tasks;
}

function parseRoadmap(roadmapContent) {
  const tasks = [];
  const phases = roadmapContent.split(/Phase \d+/).filter(Boolean);

  phases.forEach(phase => {
    const lines = phase.split('\n').filter(Boolean);
    const phaseTitle = lines[0].trim();
    const components = phase.split(/\d+\.\s+/).filter(Boolean);

    components.forEach(component => {
      const lines = component.split('\n').filter(Boolean);
      const title = lines[0].trim();
      const subTasks = lines
        .slice(1)
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().slice(2));

      tasks.push({
        title: `${phaseTitle} - ${title}`,
        description: `Implement ${title.toLowerCase()} for ${phaseTitle}`,
        status: 'pending',
        priority: phaseTitle.includes('Core') ? 'high' : 'medium',
        dependencies: [],
        details: subTasks.join('\n'),
        testStrategy: `Verify all ${title.toLowerCase()} functionality`,
        subtasks: subTasks.map((task, idx) => ({
          id: idx + 1,
          title: task.trim(),
          status: 'pending',
          priority: 'medium',
          description: `Implement ${task.trim().toLowerCase()}`
        }))
      });
    });
  });

  return tasks;
}

function setupDependencies(tasks, dependencyChain) {
  const foundationComponents = extractSection(dependencyChain, 'Foundation Components:', 'Progressive Enhancement:')
    .split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s+/, '').trim());

  const progressiveEnhancements = extractSection(dependencyChain, 'Progressive Enhancement:', 'User Interface Priority:')
    .split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s+/, '').trim());

  // Set up foundation dependencies
  foundationComponents.forEach((component, idx) => {
    const relatedTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(component.toLowerCase()) ||
      task.description.toLowerCase().includes(component.toLowerCase())
    );

    relatedTasks.forEach(task => {
      if (idx > 0) {
        const previousComponent = foundationComponents[idx - 1];
        const dependencyTasks = tasks.filter(t => 
          t.title.toLowerCase().includes(previousComponent.toLowerCase()) ||
          t.description.toLowerCase().includes(previousComponent.toLowerCase())
        );
        task.dependencies.push(...dependencyTasks.map(t => t.id));
      }
    });
  });

  // Set up progressive enhancement dependencies
  progressiveEnhancements.forEach((enhancement, idx) => {
    const relatedTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(enhancement.toLowerCase()) ||
      task.description.toLowerCase().includes(enhancement.toLowerCase())
    );

    relatedTasks.forEach(task => {
      if (idx > 0) {
        const previousEnhancement = progressiveEnhancements[idx - 1];
        const dependencyTasks = tasks.filter(t => 
          t.title.toLowerCase().includes(previousEnhancement.toLowerCase()) ||
          t.description.toLowerCase().includes(previousEnhancement.toLowerCase())
        );
        task.dependencies.push(...dependencyTasks.map(t => t.id));
      }
    });
  });

  // Remove duplicate dependencies
  tasks.forEach(task => {
    task.dependencies = [...new Set(task.dependencies)];
  });
}

export { parsePRD }; 