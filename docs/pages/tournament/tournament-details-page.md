# Tournament Details Page Documentation

## Overview
The Tournament Details Page provides comprehensive information about a specific tournament, including its schedule, participants, results, and management options.

## Path
`/tournaments/:id`

## Component
`TournamentDetailsPage` from `@/pages/TournamentDetail`

## Features
- Detailed tournament information display
- Tournament schedule and brackets
- Participant/team listings
- Results and standings
- Registration status and options
- Administrative controls for organizers
- Navigation to specialized tournament management pages

## User Flow
1. User navigates to a tournament details page via tournament ID
2. User views comprehensive information about the tournament
3. User can access various tournament sections via tabs or navigation
4. Organizers have access to management controls

## States
- Loading state (while fetching tournament data)
- Loaded state with tournament details
- Error state (if tournament cannot be found or accessed)
- Different views based on user role and permissions

## Sections
- Overview: Key tournament information
- Schedule: Match schedule and brackets
- Participants: Registered players or teams
- Results: Match results and standings
- Announcements: Tournament-specific announcements
- Settings: Management options (for organizers)

## API Endpoints
- `GET /api/tournaments/:id` - Retrieves tournament details
- `GET /api/tournaments/:id/participants` - Retrieves tournament participants
- `GET /api/tournaments/:id/schedule` - Retrieves tournament schedule
- `GET /api/tournaments/:id/results` - Retrieves tournament results

## Role-based Content
- Participants: Basic viewing permissions
- Organizers: Full management controls
- Scorekeepers: Score entry options
- Spectators: View-only access to public information

## Management Actions (for Organizers)
- Edit tournament details
- Manage registrations
- Create/edit schedule
- Update results
- Publish announcements
- Assign courts
- Manage check-ins

## Related Pages
- [Tournament List Page](./tournament-list-page.md)
- [Tournament Registration Page](./tournament-registration-page.md)
- [Registration Management Page](./registration-management-page.md)
- [Match Schedule Page](../match/match-schedule-page.md)
- [Court Assignment Page](../match/court-assignment-page.md)
