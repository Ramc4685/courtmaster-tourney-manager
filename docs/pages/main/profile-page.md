# Profile Page Documentation

## Overview
The Profile Page allows users to view and manage their personal information, account settings, and preferences within the CourtMaster system.

## Path
`/profile`

## Component
`ProfilePage` from `@/pages/Profile`

## Features
- Personal information display and editing
- Password management
- Notification preferences
- Account linking (if applicable)
- Profile picture management
- Tournament participation history
- User preferences and settings

## User Flow
1. User navigates to profile page
2. User views current profile information
3. User can edit various sections of their profile
4. Changes are saved and reflected immediately

## States
- View mode (displaying current information)
- Edit mode (for updating information)
- Loading states (while saving changes)
- Success/Error states (after operations)

## Form Sections
- Personal Information (name, email, contact details)
- Password Management
- Notification Settings
- Profile Picture
- Display Preferences

## API Endpoints
- `GET /api/user/profile` - Retrieves current user profile
- `PUT /api/user/profile` - Updates user profile information
- `PUT /api/user/password` - Updates user password
- `PUT /api/user/preferences` - Updates user preferences
- `PUT /api/user/avatar` - Updates profile picture

## Security Considerations
- Sensitive operations require password confirmation
- Input validation for all form fields
- Protection against unauthorized profile edits
- CSRF protection for form submissions

## Accessibility
- All form elements are properly labeled
- Error states are clearly communicated
- Keyboard navigation is supported
- Screen reader compatible

## Related Pages
- [Dashboard Page](./dashboard-page.md)
- [Tournament History](../tournament/tournament-history-page.md)
