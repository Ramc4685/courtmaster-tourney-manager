import React, { useState, useEffect, useCallback } from 'react';

// Training module interfaces
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'advanced' | 'troubleshooting' | 'best-practices';
  role?: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  lessons: TrainingLesson[];
  assessment?: TrainingAssessment;
}

interface TrainingLesson {
  id: string;
  title: string;
  type: 'video' | 'interactive' | 'reading' | 'simulation';
  content: string;
  videoUrl?: string;
  interactiveElements?: InteractiveElement[];
  duration: number;
}

interface InteractiveElement {
  id: string;
  type: 'quiz' | 'drag-drop' | 'click-sequence' | 'form-fill';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  feedback: string;
}

interface TrainingAssessment {
  id: string;
  title: string;
  questions: AssessmentQuestion[];
  passingScore: number;
  timeLimit?: number;
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'scenario';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

interface UserProgress {
  moduleId: string;
  completedLessons: string[];
  assessmentScore?: number;
  completedAt?: string;
  timeSpent: number;
}

// Training modules data
const trainingModules: TrainingModule[] = [
  {
    id: 'tournament-creation',
    title: 'Tournament Creation Mastery',
    description: 'Learn to create and configure tournaments effectively',
    category: 'basics',
    role: 'ORGANIZER',
    estimatedTime: 15,
    difficulty: 'beginner',
    lessons: [
      {
        id: 'basics-overview',
        title: 'Tournament Basics Overview',
        type: 'video',
        content: 'Introduction to tournament types and formats',
        videoUrl: '/videos/tournament-basics.mp4',
        duration: 5,
      },
      {
        id: 'hands-on-creation',
        title: 'Hands-on Tournament Creation',
        type: 'interactive',
        content: 'Create your first tournament step by step',
        duration: 8,
        interactiveElements: [
          {
            id: 'tournament-type',
            type: 'quiz',
            question: 'Which tournament format is best for 8 teams with limited time?',
            options: ['Single Elimination', 'Double Elimination', 'Round Robin', 'Swiss System'],
            correctAnswer: 'Single Elimination',
            feedback: 'Single elimination is fastest for limited time scenarios.',
          },
        ],
      },
    ],
    assessment: {
      id: 'tournament-creation-test',
      title: 'Tournament Creation Assessment',
      passingScore: 80,
      timeLimit: 10,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the minimum number of participants for a tournament?',
          options: ['2', '4', '8', '16'],
          correctAnswer: '2',
          explanation: 'A tournament can have as few as 2 participants.',
          points: 10,
        },
      ],
    },
  },
];

// Interactive Training Module Component
export const InteractiveTrainingModule: React.FC<{
  moduleId?: string;
  onComplete?: (moduleId: string, score: number) => void;
}> = ({ moduleId, onComplete }) => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('training-progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.warn('Failed to parse training progress:', error);
      }
    }
  }, []);

  // Save progress
  const saveProgress = useCallback((newProgress: UserProgress[]) => {
    localStorage.setItem('training-progress', JSON.stringify(newProgress));
    setProgress(newProgress);
  }, []);

  // Select module
  const selectModule = useCallback((module: TrainingModule) => {
    setSelectedModule(module);
    setCurrentLessonIndex(0);
    setIsAssessmentMode(false);
  }, []);

  // Complete lesson
  const completeLesson = useCallback((lessonId: string) => {
    if (!selectedModule) return;

    const moduleProgress = progress.find(p => p.moduleId === selectedModule.id) || {
      moduleId: selectedModule.id,
      completedLessons: [],
      timeSpent: 0,
    };

    if (!moduleProgress.completedLessons.includes(lessonId)) {
      const updatedProgress = progress.filter(p => p.moduleId !== selectedModule.id);
      updatedProgress.push({
        ...moduleProgress,
        completedLessons: [...moduleProgress.completedLessons, lessonId],
      });
      saveProgress(updatedProgress);
    }

    // Move to next lesson or assessment
    if (currentLessonIndex < selectedModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (selectedModule.assessment) {
      setIsAssessmentMode(true);
    }
  }, [selectedModule, progress, currentLessonIndex, saveProgress]);

  // Submit assessment
  const submitAssessment = useCallback(() => {
    if (!selectedModule?.assessment) return;

    let totalScore = 0;
    let maxScore = 0;

    selectedModule.assessment.questions.forEach(question => {
      maxScore += question.points;
      const userAnswer = assessmentAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        totalScore += question.points;
      }
    });

    const scorePercentage = (totalScore / maxScore) * 100;
    
    const moduleProgress = progress.find(p => p.moduleId === selectedModule.id) || {
      moduleId: selectedModule.id,
      completedLessons: [],
      timeSpent: 0,
    };

    const updatedProgress = progress.filter(p => p.moduleId !== selectedModule.id);
    updatedProgress.push({
      ...moduleProgress,
      assessmentScore: scorePercentage,
      completedAt: scorePercentage >= selectedModule.assessment.passingScore ? new Date().toISOString() : undefined,
    });

    saveProgress(updatedProgress);
    onComplete?.(selectedModule.id, scorePercentage);
  }, [selectedModule, assessmentAnswers, progress, saveProgress, onComplete]);

  // Get module progress
  const getModuleProgress = useCallback((moduleId: string) => {
    return progress.find(p => p.moduleId === moduleId);
  }, [progress]);

  // Module list view
  if (!selectedModule) {
    return (
      <div className="training-module-list">
        <h2>Interactive Training Modules</h2>
        <div className="modules-grid">
          {trainingModules.map(module => {
            const moduleProgress = getModuleProgress(module.id);
            const isCompleted = moduleProgress?.completedAt;
            
            return (
              <div key={module.id} className={`module-card ${isCompleted ? 'completed' : ''}`}>
                <div className="module-header">
                  <h3>{module.title}</h3>
                  <span className={`difficulty ${module.difficulty}`}>
                    {module.difficulty}
                  </span>
                </div>
                
                <p className="module-description">{module.description}</p>
                
                <div className="module-meta">
                  <span className="duration">⏱️ {module.estimatedTime} min</span>
                  <span className="category">{module.category}</span>
                </div>
                
                {moduleProgress && (
                  <div className="progress-info">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(moduleProgress.completedLessons.length / module.lessons.length) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {moduleProgress.completedLessons.length}/{module.lessons.length} lessons
                    </span>
                  </div>
                )}
                
                <button
                  className="start-module-btn"
                  onClick={() => selectModule(module)}
                >
                  {isCompleted ? 'Review' : moduleProgress ? 'Continue' : 'Start'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Assessment view
  if (isAssessmentMode && selectedModule.assessment) {
    return (
      <div className="assessment-view">
        <h2>{selectedModule.assessment.title}</h2>
        <div className="assessment-info">
          <p>Passing Score: {selectedModule.assessment.passingScore}%</p>
          {selectedModule.assessment.timeLimit && (
            <p>Time Limit: {selectedModule.assessment.timeLimit} minutes</p>
          )}
        </div>
        
        <div className="questions">
          {selectedModule.assessment.questions.map((question, index) => (
            <div key={question.id} className="question">
              <h4>Question {index + 1}</h4>
              <p>{question.question}</p>
              
              {question.type === 'multiple-choice' && question.options && (
                <div className="options">
                  {question.options.map(option => (
                    <label key={option} className="option">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        onChange={(e) => setAssessmentAnswers(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="assessment-actions">
          <button onClick={() => setIsAssessmentMode(false)}>
            Back to Lessons
          </button>
          <button 
            className="submit-btn"
            onClick={submitAssessment}
          >
            Submit Assessment
          </button>
        </div>
      </div>
    );
  }

  // Lesson view
  const currentLesson = selectedModule.lessons[currentLessonIndex];
  
  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <button onClick={() => setSelectedModule(null)}>← Back to Modules</button>
        <h2>{selectedModule.title}</h2>
        <div className="lesson-progress">
          Lesson {currentLessonIndex + 1} of {selectedModule.lessons.length}
        </div>
      </div>
      
      <div className="lesson-content">
        <h3>{currentLesson.title}</h3>
        
        {currentLesson.type === 'video' && currentLesson.videoUrl && (
          <div className="video-container">
            <video controls width="100%">
              <source src={currentLesson.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        
        <div className="lesson-text">
          {currentLesson.content}
        </div>
        
        {currentLesson.interactiveElements && (
          <div className="interactive-elements">
            {currentLesson.interactiveElements.map(element => (
              <div key={element.id} className="interactive-element">
                <h4>{element.question}</h4>
                {element.type === 'quiz' && element.options && (
                  <div className="quiz-options">
                    {element.options.map(option => (
                      <button key={option} className="quiz-option">
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="lesson-actions">
        {currentLessonIndex > 0 && (
          <button onClick={() => setCurrentLessonIndex(currentLessonIndex - 1)}>
            Previous Lesson
          </button>
        )}
        
        <button 
          className="complete-lesson-btn"
          onClick={() => completeLesson(currentLesson.id)}
        >
          {currentLessonIndex === selectedModule.lessons.length - 1 
            ? (selectedModule.assessment ? 'Take Assessment' : 'Complete Module')
            : 'Next Lesson'
          }
        </button>
      </div>
      
      <style>{`
        .training-module-list {
          padding: 20px;
        }
        
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .module-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          background: white;
        }
        
        .module-card.completed {
          border-color: #4caf50;
          background: #f8fff8;
        }
        
        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .difficulty {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .difficulty.beginner { background: #e8f5e8; color: #2e7d32; }
        .difficulty.intermediate { background: #fff3e0; color: #f57c00; }
        .difficulty.advanced { background: #ffebee; color: #c62828; }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0 5px;
        }
        
        .progress-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s ease;
        }
        
        .start-module-btn {
          width: 100%;
          padding: 10px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
        }
        
        .lesson-view {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .lesson-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .video-container {
          margin: 20px 0;
        }
        
        .interactive-elements {
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }
        
        .quiz-option {
          padding: 10px;
          text-align: left;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .quiz-option:hover {
          background: #e9ecef;
        }
        
        .lesson-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .complete-lesson-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .assessment-view {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .questions {
          margin: 20px 0;
        }
        
        .question {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        
        .options {
          margin-top: 15px;
        }
        
        .option {
          display: block;
          margin: 10px 0;
          cursor: pointer;
        }
        
        .assessment-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        
        .submit-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
