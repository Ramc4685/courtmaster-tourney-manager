import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Help content interfaces
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  context?: string; // Page or component context
  videoUrl?: string;
  relatedArticles?: string[];
}

interface HelpContextType {
  isHelpVisible: boolean;
  currentArticle: HelpArticle | null;
  searchQuery: string;
  searchResults: HelpArticle[];
  showHelp: (articleId?: string) => void;
  hideHelp: () => void;
  searchHelp: (query: string) => void;
  getContextualHelp: (context: string) => HelpArticle[];
}

// Default help articles
const helpArticles: HelpArticle[] = [
  {
    id: 'tournament-creation',
    title: 'How to Create a Tournament',
    content: 'Step-by-step guide to creating your first tournament in CourtMaster.',
    category: 'Getting Started',
    tags: ['tournament', 'create', 'setup'],
    context: 'tournaments',
  },
  {
    id: 'scoring-matches',
    title: 'Scoring Matches',
    content: 'Learn how to enter and update match scores effectively.',
    category: 'Match Management',
    tags: ['scoring', 'matches', 'results'],
    context: 'matches',
  },
  {
    id: 'team-management',
    title: 'Managing Teams',
    content: 'Add, edit, and organize teams in your tournaments.',
    category: 'Team Management',
    tags: ['teams', 'players', 'roster'],
    context: 'teams',
  },
];

// Create help context
const HelpContext = createContext<HelpContextType | undefined>(undefined);

// Help provider component
export const ContextualHelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<HelpArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);

  // Show help
  const showHelp = useCallback((articleId?: string) => {
    if (articleId) {
      const article = helpArticles.find(a => a.id === articleId);
      setCurrentArticle(article || null);
    }
    setIsHelpVisible(true);
  }, []);

  // Hide help
  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
    setCurrentArticle(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Search help articles
  const searchHelp = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = helpArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(results);
  }, []);

  // Get contextual help
  const getContextualHelp = useCallback((context: string) => {
    return helpArticles.filter(article => article.context === context);
  }, []);

  const contextValue: HelpContextType = {
    isHelpVisible,
    currentArticle,
    searchQuery,
    searchResults,
    showHelp,
    hideHelp,
    searchHelp,
    getContextualHelp,
  };

  return (
    <HelpContext.Provider value={contextValue}>
      {children}
      {isHelpVisible && <HelpModal />}
    </HelpContext.Provider>
  );
};

// Help modal component
const HelpModal: React.FC = () => {
  const { currentArticle, searchQuery, searchResults, hideHelp, searchHelp } = useHelp();

  return (
    <div className="help-modal-overlay" onClick={hideHelp}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>Help & Support</h2>
          <button className="close-btn" onClick={hideHelp}>✕</button>
        </div>

        <div className="help-search">
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => searchHelp(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="help-content">
          {currentArticle ? (
            <div className="article-view">
              <h3>{currentArticle.title}</h3>
              <div className="article-content">
                {currentArticle.content}
              </div>
              {currentArticle.videoUrl && (
                <div className="video-container">
                  <video controls width="100%">
                    <source src={currentArticle.videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map(article => (
                <div key={article.id} className="result-item">
                  <h4>{article.title}</h4>
                  <p>{article.content.substring(0, 150)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="help-categories">
              <h3>Browse Help Topics</h3>
              {helpArticles.map(article => (
                <div key={article.id} className="help-item">
                  <h4>{article.title}</h4>
                  <p>{article.content.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .help-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .help-modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .help-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 5px;
        }

        .help-search {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .help-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .help-item, .result-item {
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
        }

        .help-item:hover, .result-item:hover {
          background: #f8f9fa;
        }

        .help-item h4, .result-item h4 {
          margin: 0 0 8px 0;
          color: #007bff;
        }

        .help-item p, .result-item p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .article-content {
          line-height: 1.6;
          margin: 20px 0;
        }

        .video-container {
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

// Hook to use help context
export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a ContextualHelpProvider');
  }
  return context;
};

// Help button component
export const HelpButton: React.FC<{ context?: string }> = ({ context }) => {
  const { showHelp, getContextualHelp } = useHelp();

  const handleClick = () => {
    if (context) {
      const contextualArticles = getContextualHelp(context);
      if (contextualArticles.length > 0) {
        showHelp(contextualArticles[0].id);
        return;
      }
    }
    showHelp();
  };

  return (
    <button className="help-button" onClick={handleClick} title="Get Help">
      ?
      <style>{`
        .help-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 999;
        }

        .help-button:hover {
          background: #0056b3;
          transform: scale(1.05);
        }
      `}</style>
    </button>
  );
};
