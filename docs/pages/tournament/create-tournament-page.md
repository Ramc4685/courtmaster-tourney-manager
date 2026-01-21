# Create Tournament Page Documentation

## Overview
The Create Tournament Page provides an interface for authorized users to create new tournaments in the CourtMaster system, setting up all necessary tournament parameters and configuration.

## Path
`/tournaments/new`

## Component
`CreateTournamentPage` from `@/pages/tournaments/CreateTournamentPage`

## Features
- Comprehensive tournament creation form
- Sport type selection
- Tournament format configuration
- Date and location settings
- Registration options
- Division and bracket setup
- Tournament rules configuration

## User Flow
1. User navigates to the create tournament page
2. User fills out tournament details across multiple form sections
3. System validates input data
4. User submits the form
5. System creates the tournament
6. User is redirected to the new tournament's details page

## States
- Form input state
- Validation state
- Loading state (during tournament creation)
- Success state (after creation)
- Error state (validation or server errors)

## Form Sections
- Basic Information (name, description, sport type)
- Dates and Times (start/end dates, registration deadlines)
- Location (venue details, court information)
- Format (single/double elimination, round robin, custom)
- Divisions (age groups, skill levels)
- Registration Settings (open/closed, fees, capacity)
- Rules and Scoring System

## API Endpoints
- `POST /api/tournaments` - Creates a new tournament
- `GET /api/sports` - Retrieves available sport types
- `GET /api/venues` - Retrieves available venues (if applicable)

## Validation
- Required fields validation
- Date logic validation (end date after start date, etc.)
- Format-specific validation
- Capacity and court availability checks

## Related Pages
- [Tournament List Page](./tournament-list-page.md)
- [Tournament Templates Page](./tournament-templates-page.md)
- [Tournament Wizard Page](./tournament-wizard-page.md)
- [Tournament Details Page](./tournament-details-page.md)
