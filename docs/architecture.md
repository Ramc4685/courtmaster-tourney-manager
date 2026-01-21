# Technical Architecture

## System Architecture Overview

CourtMaster Tournament Management System is a production-ready tournament management platform built using modern React architecture patterns. The system has evolved from MVP requirements into a comprehensive solution supporting multiple sports, real-time scoring, offline functionality, and PWA capabilities.

## Current Feature Matrix

| Feature Category | MVP Requirement | Current Implementation | Status |
|------------------|-----------------|------------------------|---------|
| **Sports Support** | Single sport (Badminton) | Multi-sport (Badminton, Tennis, Volleyball) | ✅ Enhanced |
| **Tournament Formats** | Single Elimination | Single Elimination + Round Robin | ✅ Enhanced |
| **Scoring System** | Basic scoring | Sport-specific rules + Real-time updates | ✅ Enhanced |
| **User Management** | Basic auth | Role-based access + Profile management | ✅ Enhanced |
| **Offline Support** | Not required | Full offline functionality + Sync | ✅ Added |
| **PWA Features** | Not required | Installable app + Push notifications | ✅ Added |
| **Real-time Updates** | Basic | WebSocket + Event-driven architecture | ✅ Enhanced |
| **Mobile Support** | Responsive | Touch-optimized + Native-like experience | ✅ Enhanced |
| **Analytics** | Not required | Comprehensive tournament analytics | ✅ Added |
| **Multi-tenancy** | Single tournament | Multiple concurrent tournaments | ✅ Enhanced |

## Frontend Architecture

### Component Structure
- **Presentation Components**: Pure UI components without business logic
- **Container Components**: Business logic and state management
- **Layout Components**: Page structure and navigation
- **Feature Components**: Domain-specific functionality

### State Management
- **React Context**: Application-wide state (auth, tournaments, notifications)
- **Custom Hooks**: Encapsulated business logic and data access
- **Local State**: Component-specific state using useState/useReducer
- **Event Bus**: Decoupled component communication

### Sport-Specific Architecture

The system implements a sophisticated rules engine supporting multiple sports:

```
┌─────────────────────────────────────────────────────────────┐
│                    Sport Rules Factory                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Badminton   │  │   Tennis    │  │ Volleyball  │         │
│  │   Rules     │  │    Rules    │  │    Rules    │         │
│  │             │  │             │  │             │         │
│  │ • 21 points │  │ • 6 games   │  │ • 25 points │         │
│  │ • Win by 2  │  │ • Win by 2  │  │ • Win by 2  │         │
│  │ • Max 30    │  │ • Tiebreak  │  │ • Max 30    │         │
│  │ • Best of 3 │  │ • Best of 3 │  │ • Best of 5 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Services      │    │   Repositories  │
│                 │────│                 │────│                 │
│ - UI Logic      │    │ - Business      │    │ - Data Access   │
│ - User Events   │    │   Logic         │    │ - API Calls     │
│ - Presentation  │    │ - Validation    │    │ - Caching       │
│ - Sport Rules   │    │ - Tournament    │    │ - Offline Sync  │
│ - Real-time UI  │    │   Management    │    │ - Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Hierarchy

```
src/components/
├── scoring/
│   ├── ScoreEntry.tsx           # Individual score input
│   ├── ScoringInterface.tsx     # Complete scoring workflow
│   ├── MatchCard.tsx           # Match display component
│   └── LiveScoreboard.tsx      # Real-time score display
├── tournament/
│   ├── TournamentDashboard.tsx # Tournament overview
│   ├── BracketView.tsx         # Tournament bracket
│   ├── StandingsTable.tsx      # Team standings
│   └── MatchSchedule.tsx       # Match scheduling
├── admin/
│   ├── TournamentManager.tsx   # Admin controls
│   ├── UserManagement.tsx      # User administration
│   └── SystemSettings.tsx      # System configuration
└── shared/
    ├── LoadingSpinner.tsx      # Loading states
    ├── ErrorBoundary.tsx       # Error handling
    └── OfflineIndicator.tsx    # Offline status
```

## Backend Integration

### Appwrite Integration
- **Authentication**: User management and session handling
- **Database**: Real-time data operations with Appwrite Database
- **Storage**: File uploads and asset management
- **Real-time**: WebSocket connections for live updates

### Data Layer
- **Repository Pattern**: Abstracted data access layer
- **Service Pattern**: Business logic encapsulation
- **Factory Pattern**: Sport-specific rule implementations

## Event-Driven Architecture

### Event Bus System
```ts
interface EventBus {
  emit<T extends keyof EventMap>(event: T, payload: EventMap[T]): void;
  on<T extends keyof EventMap>(event: T, handler: (payload: EventMap[T]) => void): void;
  off<T extends keyof EventMap>(event: T, handler: (payload: EventMap[T]) => void): void;
}
```

### Event Flow
1. User action triggers component event
2. Component emits domain event through event bus
3. Services listen to events and execute business logic
4. State updates trigger component re-renders
5. Real-time updates propagate to other users

## Offline Architecture

### Data Synchronization
- **IndexedDB**: Local data persistence
- **Operation Queue**: Offline action storage
- **Conflict Resolution**: Merge strategies for concurrent edits
- **Background Sync**: Automatic synchronization when online

### Sync Strategy
```
Online State:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │────│  Appwrite   │────│  Database   │
│   State     │    │   API       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘

Offline State:
┌─────────────┐    ┌─────────────┐
│   Client    │────│  IndexedDB  │
│   State     │    │   Queue     │
└─────────────┘    └─────────────┘
```

## Performance Optimizations

### Code Splitting
- Route-based code splitting
- Feature-based lazy loading
- Dynamic imports for heavy components

### Caching Strategy
- Service Worker for static assets
- IndexedDB for application data
- React Query for server state management

### Bundle Optimization
- Tree shaking for unused code elimination
- Webpack optimizations for production builds
- Asset compression and minification

## Security Architecture

### Authentication Flow
1. User credentials validated against Appwrite Auth
2. JWT tokens stored securely in httpOnly cookies
3. Token refresh handled automatically
4. Role-based access control enforced

### Data Security
- Input validation at component and service levels
- XSS prevention through React's built-in protections
- CSRF protection via secure token handling
- Secure API communication over HTTPS

## Testing Architecture

The system implements comprehensive testing with 80% coverage target:

### Test Pyramid
```
        /\
       /  \    E2E Tests (5%)
      /____\   - Critical user journeys
     /      \  - Cross-browser compatibility
    /__________\ Integration Tests (20%)
                - Service interactions
                - Workflow testing
                - Multi-sport scenarios
    ____________________________________________
    Unit Tests (75%)
    - Business logic (Sport rules, scoring)
    - Utility functions (Tournament utils)
    - Component behavior (UI interactions)
    - Service methods (API calls, data handling)
```

### Test Coverage by Domain
- **Sport Rules**: 90%+ (Critical business logic)
- **Scoring Logic**: 95%+ (Core functionality)
- **Tournament Formats**: 85%+ (Bracket generation)
- **Service Layer**: 80%+ (API interactions)
- **UI Components**: 75%+ (User interactions)

### Test Infrastructure
```
src/test/
├── unit/
│   ├── rules/                  # Sport rules testing
│   ├── utils/                  # Utility function tests
│   ├── formats/                # Tournament format tests
│   ├── services/               # Service layer tests
│   └── components/             # Component tests
├── integration/
│   ├── tournament-scoring-workflow.test.tsx
│   └── multi-sport-tournament.test.tsx
├── utils.ts                    # Test utilities and mocks
├── setup.ts                    # Global test setup
└── mvp-setup.ts               # MVP-specific test configuration
```

## PWA Architecture

### Progressive Web App Features
- **Offline-First**: Full functionality without internet
- **Installable**: Native app-like experience
- **Push Notifications**: Real-time tournament updates
- **Background Sync**: Automatic data synchronization

### Service Worker Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Shell     │    │ Service Worker  │    │   IndexedDB     │
│                 │────│                 │────│                 │
│ - UI Framework  │    │ - Cache API     │    │ - Tournament    │
│ - Core Logic    │    │ - Background    │    │   Data          │
│ - Routing       │    │   Sync          │    │ - User Prefs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Real-time Synchronization Architecture

### Event-Driven Updates
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client A  │    │  Appwrite   │    │   Client B  │
│             │────│  Realtime   │────│             │
│ Score: 15-12│    │   Server    │    │ Score: 15-12│
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Local State │    │ Database    │    │ Local State │
│   Update    │    │   Update    │    │   Update    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Conflict Resolution
- **Last-Write-Wins**: For simple score updates
- **Operational Transform**: For complex tournament state changes
- **Manual Resolution**: For critical conflicts requiring user input

## Performance Optimizations

### Current Optimizations
- **Code Splitting**: Route and feature-based lazy loading
- **Service Worker Caching**: Static assets and API responses
- **IndexedDB**: Local data persistence and offline support
- **React Query**: Server state management and caching
- **Bundle Analysis**: Tree shaking and dead code elimination
- **Image Optimization**: WebP format and lazy loading
- **Critical CSS**: Above-the-fold content prioritization

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Deployment Architecture

### Multi-Environment Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Pilot       │    │   Production    │
│                 │    │                 │    │                 │
│ - Local DB      │    │ - Shared DB     │    │ - Dedicated DB  │
│ - Hot Reload    │    │ - Feature Test  │    │ - CDN           │
│ - Debug Mode    │    │ - User Testing  │    │ - Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Build Process
```
Source Code → TypeScript Compilation → Webpack Bundling → 
PWA Manifest → Service Worker → Asset Optimization → 
Docker Container → Cloud Deployment
```

### Infrastructure
- **Frontend**: Vercel/Netlify with CDN
- **Backend**: Appwrite Cloud with auto-scaling
- **Database**: Distributed across regions
- **Storage**: Global CDN for assets
- **Monitoring**: Real-time error tracking and performance metrics

### Deployment Strategies
- **Blue-Green Deployment**: Zero-downtime releases
- **Feature Flags**: Gradual feature rollout
- **A/B Testing**: User experience optimization
- **Rollback Capability**: Quick reversion for issues

## Security Architecture

### Enhanced Security Measures
- **Role-Based Access Control**: Granular permissions system
- **JWT Token Management**: Secure authentication flow
- **Input Validation**: Client and server-side validation
- **XSS Prevention**: Content Security Policy implementation
- **CSRF Protection**: Token-based request validation
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive activity tracking

### Privacy Compliance
- **GDPR Compliance**: User data protection and rights
- **Data Minimization**: Collect only necessary information
- **Consent Management**: Clear user consent mechanisms
- **Data Retention**: Automated cleanup of old data

## Monitoring and Analytics

### System Monitoring
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Web Vitals and custom metrics
- **Uptime Monitoring**: 24/7 availability tracking
- **Resource Usage**: CPU, memory, and bandwidth monitoring

### Business Analytics
- **Tournament Metrics**: Participation rates, completion times
- **User Engagement**: Feature usage and retention rates
- **Performance Analytics**: Score update latency, sync success rates
- **Mobile Usage**: PWA installation and usage patterns

---

*Architecture documentation last updated: 2025-09-17*
*System has evolved significantly beyond original MVP scope into a production-ready platform*