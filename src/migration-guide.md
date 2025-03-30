
# State Management Migration Guide

This document outlines the migration path from React Context API to Zustand for state management.

## Overview

The application is being migrated from the Context API to Zustand for improved:
- Performance
- Developer experience
- Code organization
- Maintainability

## Migration Strategy

The migration follows these steps:

1. **Parallel Systems**: Both Context API and Zustand implementations exist side-by-side
2. **Feature-by-Feature Migration**: Each feature is migrated incrementally
3. **Adapter Pattern**: Compatibility layers ensure components work with either implementation
4. **Gradual Adoption**: Components are updated one at a time to use the new API directly

## Switching Between Implementations

To toggle between Context API and Zustand:

```bash
# Use Context API (default)
npm run dev

# Use Zustand
npm run dev:zustand
```

## Migration Status

| Feature                 | Status      |
|-------------------------|-------------|
| Tournament CRUD         | ✅ Complete |
| Team Management         | ✅ Complete |
| Match Operations        | 🔄 In Progress |
| Court Management        | 🔄 In Progress |
| Scoring                 | 🔄 In Progress |
| Tournament Progression  | ❌ Not Started |
| Category Management     | ❌ Not Started |

## File Structure

```
src/
├── contexts/                 # Original Context API implementation
│   └── tournament/
│       ├── TournamentContext.tsx
│       └── ...
├── stores/                   # New Zustand implementation
│   ├── tournamentStore.ts    # Main tournament store
│   ├── scoringStore.ts       # Scoring functionality
│   └── adapters/             # Compatibility layers
│       └── tournamentStoreAdapter.tsx
└── hooks/                    # Adapter hooks
    ├── scoring/
    │   └── useScoringAdapter.ts
    └── ...
```

## Migration Checklist

When migrating a component:

1. Import from adapter instead of direct context
2. Test with both implementations
3. Update component to use store directly when stable
4. Remove adapter dependency when all components are migrated

## Final Steps

Once all features are migrated:
1. Remove Context implementation
2. Remove adapters
3. Set `USE_ZUSTAND=true` as default
4. Clean up unused files
