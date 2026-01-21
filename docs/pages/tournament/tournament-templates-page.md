# Tournament Templates Page Documentation

## Overview
The Tournament Templates Page allows users to browse, select, and manage tournament templates for quickly creating tournaments with predefined settings and configurations.

## Path
`/tournaments/templates`

## Component
`TournamentTemplatesPage` from `@/pages/tournament/TournamentTemplatesPage`

## Features
- Library of tournament templates for various sports
- Template browsing with filtering options
- Template preview and details
- Template selection for new tournament creation
- Custom template creation (for authorized users)
- Template duplication and customization

## User Flow
1. User navigates to the tournament templates page
2. User browses available templates by sport or category
3. User can preview template details
4. User can select a template to create a new tournament
5. Authorized users can create or duplicate templates

## States
- Loading state (while fetching templates)
- Loaded state with template library
- Empty state (no templates available)
- Selection state (when template is selected)
- Error state (if templates cannot be retrieved)

## Template Categories
- All Templates
- My Templates (user-created)
- Community Templates (shared by other users)

## Template Information
- Template name
- Sport type
- Tournament format
- Number of divisions
- Players per team (if team-based)
- Estimated duration
- Scoring system
- Created by (author)

## API Endpoints
- `GET /api/tournament-templates` - Retrieves all accessible templates
- `GET /api/tournament-templates/:id` - Retrieves specific template details
- `POST /api/tournament-templates` - Creates a new template
- `POST /api/tournaments/from-template/:id` - Creates tournament from template

## Actions
- Use Template: Creates a new tournament based on the template
- Duplicate Template: Creates a copy for customization
- Create Template: Creates a new custom template (if authorized)
- Edit Template: Modifies existing template (if owner or admin)

## Related Pages
- [Tournament List Page](./tournament-list-page.md)
- [Create Tournament Page](./create-tournament-page.md)
- [Tournament Wizard Page](./tournament-wizard-page.md)
