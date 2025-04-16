export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StageTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StageTransitionError';
  }
}

export class BracketGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BracketGenerationError';
  }
}

export class ProgressionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressionValidationError';
  }
} 