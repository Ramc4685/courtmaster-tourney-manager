# Notifications Page Documentation

## Overview
The Notifications Page displays all system notifications for the user, including tournament updates, registration statuses, and administrative messages.

## Path
`/notifications`

## Component
`NotificationsPage` from `@/pages/NotificationsPage`

## Features
- List of all user notifications
- Notification filtering and sorting
- Read/unread status indicators
- Notification actions (mark as read, delete)
- Notification preferences management

## User Flow
1. User navigates to the notifications page
2. User views a list of notifications sorted by date (newest first)
3. User can mark notifications as read/unread
4. User can delete notifications
5. User can filter notifications by type or status

## States
- Loading state (while fetching notifications)
- Empty state (no notifications)
- Loaded state with notification list
- Error state (if notifications cannot be retrieved)

## Notification Types
- System notifications
- Tournament updates
- Registration status changes
- Match scheduling notifications
- Administrative announcements
- Payment notifications (if applicable)

## API Endpoints
- `GET /api/notifications` - Retrieves user notifications
- `PUT /api/notifications/:id` - Updates notification status
- `DELETE /api/notifications/:id` - Deletes a notification
- `PUT /api/notifications/preferences` - Updates notification preferences

## Data Management
- Pagination for large numbers of notifications
- Automatic marking as read when viewed in detail
- Bulk action support for multiple notifications

## User Preferences
- Email notification settings
- Push notification settings
- Notification frequency settings

## Related Pages
- [Dashboard Page](./dashboard-page.md)
- [Profile Page](./profile-page.md)
