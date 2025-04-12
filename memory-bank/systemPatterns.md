# System Patterns

## Architecture Overview
The CourtMaster Tournament Manager follows a modern web application architecture with the following components:

1. Frontend
   - React-based user interface
   - Component-based architecture
   - State management using React Context and hooks
   - Responsive design for mobile and desktop

2. Backend
   - Node.js/Express server
   - RESTful API design
   - WebSocket support for real-time updates
   - Authentication and authorization

3. Database
   - PostgreSQL for persistent data storage
   - Redis for caching and real-time features
   - Data models for tournaments, players, and matches

## Key Technical Decisions

### Frontend Architecture
1. Component Structure
   - Atomic design principles
   - Reusable UI components
   - Container/Presenter pattern
   - Custom hooks for business logic

2. State Management
   - React Context for global state
   - Local state for component-specific data
   - Optimistic updates for better UX
   - Error handling and recovery
   - Store reset patterns for auth state changes
   - Coordinated state updates across stores

3. Authentication Patterns
   - AuthContext provider for global auth state
   - Demo mode support with sample data
   - Proper cleanup on auth state changes
   - Navigation guards with auth checks
   - Debug logging for auth flows
   - Delayed navigation for state sync

4. Routing
   - Client-side routing with React Router
   - Protected routes for authenticated users
   - Dynamic route generation
   - Route-based code splitting

### Backend Architecture
1. API Design
   - RESTful endpoints
   - Resource-based routing
   - Versioned API endpoints
   - Input validation and sanitization

2. Authentication
   - JWT-based authentication
   - Role-based access control
   - Session management
   - Secure password handling

3. Real-time Features
   - WebSocket implementation
   - Event-driven architecture
   - Pub/Sub pattern for notifications
   - Connection management

### Database Design
1. Data Models
   - Normalized database schema
   - Relationships between entities
   - Indexing strategy
   - Data validation constraints

2. Query Optimization
   - Efficient query patterns
   - Caching strategy
   - Connection pooling
   - Transaction management

## Design Patterns
1. Repository Pattern
   - Data access abstraction
   - Business logic separation
   - Testability improvements

2. Factory Pattern
   - Object creation abstraction
   - Configuration management
   - Dependency injection

3. Observer Pattern
   - Event handling
   - State updates
   - Real-time notifications

4. Strategy Pattern
   - Algorithm selection
   - Tournament format handling
   - Scoring system implementation

## Security Patterns
1. Authentication
   - Secure token handling
   - Password hashing
   - Session management
   - CSRF protection

2. Authorization
   - Role-based access control
   - Permission management
   - Resource protection
   - Audit logging

3. Data Protection
   - Input validation
   - Output encoding
   - SQL injection prevention
   - XSS protection 