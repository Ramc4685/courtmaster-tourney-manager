# Tournament List Page Documentation

## Overview
The Tournament List Page displays all available tournaments to the user, allowing them to browse, search, and filter tournaments based on various criteria.

## Path
`/tournaments`

## Component
`TournamentListPage` from `@/pages/tournaments/TournamentListPage`

## Features
- List of all accessible tournaments
- Search and filtering options
- Tournament card view with key information
- Quick actions for each tournament
- Create new tournament button (for authorized users)
- Pagination for large lists

## User Flow
1. User navigates to the tournaments list page
2. User can view all accessible tournaments
3. User can search or filter tournaments by name, date, status, etc.
4. User can select a tournament to view details
5. Authorized users can create new tournaments

## States
- Loading state (while fetching tournament data)
- Empty state (no tournaments available)
- Loaded state with tournament list
- Error state (if data cannot be retrieved)

## Tournament Card Information
- Tournament name
- Sport type
- Date range
- Registration status
- Location
- Organizer information
- Visual indicators for tournament status

## API Endpoints
- `GET /api/tournaments` - Retrieves list of tournaments
- `GET /api/tournaments/search` - Searches tournaments by criteria

## Filters and Sorting
- Status filters (upcoming, active, completed)
- Date range filters
- Sport type filters
- Sorting options (date, name, popularity)
- Registration status filters

## Permissions
- Public tournaments visible to all users
- Private tournaments visible to invited users
- Create tournament button only for authorized roles

## Related Pages
- [Tournament Details Page](./tournament-details-page.md)
- [Create Tournament Page](./create-tournament-page.md)
- [Tournament Templates Page](./tournament-templates-page.md)
