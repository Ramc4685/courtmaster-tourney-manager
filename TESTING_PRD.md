# CourtMaster - Testing PRD

This document outlines test cases for verifying the core functionality of the CourtMaster Tournament Manager application.

**Testing Environment:** Local development server (`npm run dev`) accessed via browser.

**Tools:**
*   Multiple browser windows/incognito sessions
*   Browser Developer Tools (Console, Network)
*   Supabase Studio (for DB inspection)
*   Email client (if testing email notifications)

---

## 1. Authentication & User Roles

**Goal:** Verify users can sign up, log in, log out, and access appropriate areas based on roles (Player, Admin/Organizer).

| Test Case ID | Scenario                      | Steps                                                                                                                               | Expected Result                                                                                                                                 |
| :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01      | Demo Player Login             | 1. Navigate to Login page. <br> 2. Click "Demo Login".                                                                             | User logged in as 'Demo User', redirected to dashboard/tournaments list. No errors in console.                                                  |
| AUTH-02      | Demo Admin Login              | 1. Navigate to Login page. <br> 2. Click "Demo Admin Login".                                                                       | User logged in as 'Demo Admin', redirected to dashboard/tournaments list. Admin-specific UI elements visible (e.g., tournament creation). |
| AUTH-03      | Logout                        | 1. Log in (any user). <br> 2. Click Logout button.                                                                                | User logged out, redirected to Login page.                                                                                                      |
| AUTH-04      | Regular User Signup           | 1. Navigate to Sign Up page (if available). <br> 2. Enter valid details and sign up. <br> 3. Check Supabase `auth.users` & `profiles`. | User account created in Supabase. Profile automatically created. User potentially logged in or asked to confirm email (depending on config).   |
| AUTH-05      | Regular User Login            | 1. Use credentials from AUTH-04. <br> 2. Log in via the login form.                                                              | User logged in successfully, redirected to dashboard.                                                                                            |
| AUTH-06      | Access Control (Admin)        | 1. Log in as Admin Demo user. <br> 2. Navigate to admin-only areas (e.g., tournament creation/management pages).                   | Access granted. Admin features are visible and usable.                                                                                           |
| AUTH-07      | Access Control (Player)       | 1. Log in as Player Demo user. <br> 2. Attempt to navigate directly to admin URLs. <br> 3. Navigate to player dashboard.          | Access to admin areas denied (redirected). Player dashboard accessible.                                                                         |

---

## 2. Tournament Setup & Management (Core)

**Goal:** Verify basic tournament creation and viewing. (Note: Full format/bracket logic is pending).

| Test Case ID | Scenario                   | Steps                                                                                                                                                                                            | Expected Result                                                                                                                   |
| :----------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| TRN-01       | Create Tournament          | 1. Log in as Admin. <br> 2. Navigate to Create Tournament page. <br> 3. Fill in required details (name, dates, format=Single Elim). <br> 4. Submit. <br> 5. Check `tournaments` table in Supabase. | Tournament created successfully. Redirected to tournament list or detail page. Record exists in DB.                              |
| TRN-02       | View Tournament List       | 1. Log in (any user). <br> 2. Navigate to Tournaments list page.                                                                                                                              | List of available tournaments (including demo/created ones) displayed.                                                           |
| TRN-03       | View Tournament Details    | 1. Log in. <br> 2. Navigate to Tournaments list. <br> 3. Click on a tournament.                                                                                                                 | Tournament detail page loads showing basic info (name, dates, etc.). Tabs for Overview, Registrations, Schedule, Courts visible. |
| TRN-04       | Navigate Admin Tabs        | 1. Log in as Admin. <br> 2. Go to a Tournament Detail page. <br> 3. Click Registrations, Schedule, Courts tabs.                                                                                 | Relevant management components load within each tab (Registration Dashboard, Scheduler, Court Config/Status).                      |

---

## 3. Registration System

**Goal:** Verify player registration, admin management, waitlisting, and notifications.

| Test Case ID | Scenario                          | Steps                                                                                                                                                                                           | Expected Result                                                                                                                                                 |
| :----------- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REG-01       | Player Registration               | 1. Log in as Player. <br> 2. Navigate to a tournament open for registration. <br> 3. Complete and submit registration form.                                                                       | Success message shown. Registration appears in Admin dashboard (Task 5.3) with 'PENDING' status. In-app notification received. Optional: Email confirmation received. | 
| REG-02       | View Registrations (Admin)        | 1. Log in as Admin. <br> 2. Navigate to Tournament -> Registrations tab.                                                                                                                      | `RegistrationManagementDashboard` loads. Player/Team lists populated. Waitlist shows 0 initially.                                                              |
| REG-03       | Approve Registration (Admin)      | 1. As Admin, on Registrations tab. <br> 2. Find PENDING registration from REG-01. <br> 3. Use row action menu to "Approve".                                                                     | Registration status updates to 'APPROVED' in the list. Optional: Notification sent to player.                                                                  |
| REG-04       | Reject Registration (Admin)       | 1. As Admin, find another PENDING registration. <br> 2. Use row action menu to "Reject".                                                                                                      | Registration status updates to 'REJECTED'. Optional: Notification sent.                                                                                        |
| REG-05       | Waitlist Registration (Admin)     | 1. As Admin, find another PENDING registration. <br> 2. Use row action menu to "Move to Waitlist".                                                                                             | Registration status updates to 'WAITLIST'. Appears in the Waitlist tab. Optional: Notification sent.                                                            |
| REG-06       | Check-In Registration (Admin)     | 1. As Admin, find an APPROVED registration. <br> 2. Use row action menu to "Check In".                                                                                                         | Registration status updates to 'CHECKED_IN'.                                                                                                                  |
| REG-07       | Bulk Approve (Admin)            | 1. As Admin, select multiple PENDING registrations using checkboxes. <br> 2. Use "Bulk Actions" dropdown -> "Approve Selected".                                                                 | Statuses of selected registrations update to 'APPROVED'.                                                                                                        |
| REG-08       | Waitlist Management (Move)        | 1. As Admin, go to Waitlist tab (ensure >1 person is waitlisted). <br> 2. Use ↑/↓ buttons to change a registration's position. <br> 3. Check `metadata->waitlistPosition` in `registrations` table. | Position updates in the UI. DB value updated.                                                                                                                  |
| REG-09       | Waitlist Management (Notify)      | 1. As Admin, go to Waitlist tab. <br> 2. Click "Notify" for a registration. <br> 3. Check player's notifications (in-app/email). <br> 4. Check `metadata->waitlistNotified` timestamp in DB.       | Notification sent. Button potentially disabled after notification. Timestamp updated in DB.                                                                   |
| REG-10       | Waitlist Management (Promote)     | 1. As Admin, go to Waitlist tab. <br> 2. Click "Promote" for a registration. <br> 3. Check registration status (should be PENDING/APPROVED). <br> 4. Check if removed from Waitlist tab.          | Status updated. Removed from waitlist view. `metadata->waitlistPosition` likely cleared. Optional: Notification sent. **Note:** Waitlist shifting logic is TODO. |

---

## 4. Court Management

**Goal:** Verify court configuration and status monitoring by organizers.

| Test Case ID | Scenario                  | Steps                                                                                                                                                             | Expected Result                                                                                                                                         |
| :----------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CRT-01       | Add Court                 | 1. Log in as Admin. <br> 2. Navigate to Tournament -> Courts tab -> Configuration sub-view (if applicable). <br> 3. Click "Add Court". <br> 4. Fill form and save. | Court appears in the configuration list. Record created in `courts` table.                                                                             |
| CRT-02       | Edit Court                | 1. As Admin, in Court Configuration. <br> 2. Click Edit icon for a court. <br> 3. Change name/description in inline inputs. <br> 4. Click Save icon.                | Court details update in the list and in the DB.                                                                                                         |
| CRT-03       | Delete Court              | 1. As Admin, in Court Configuration. <br> 2. Click Delete icon for a court. <br> 3. Confirm deletion.                                                             | Court removed from the list and DB record deleted.                                                                                                      |
| CRT-04       | View Status Dashboard     | 1. As Admin, navigate to Court Status Dashboard view.                                                                                                            | Courts displayed as cards with correct status colors/icons.                                                                                             |
| CRT-05       | Realtime Status Update    | 1. Open Status Dashboard in one window. <br> 2. In another window (or Supabase Studio), update a court's status (e.g., via `courtService.updateCourtStatus` call). | Status card in the first window updates automatically without page refresh.                                                                             |

---

## 5. Match Scheduling

**Goal:** Verify manual match scheduling and related notifications.

| Test Case ID | Scenario                  | Steps                                                                                                                                                             | Expected Result                                                                                                                                         |
| :----------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SCHED-01     | View Scheduler            | 1. Log in as Admin. <br> 2. Navigate to Tournament -> Schedule tab.                                                                                                | `MatchScheduler` component loads. Table shows matches (if generated) or "No matches" message.                                                          |
| SCHED-02     | Manually Schedule Match   | 1. Ensure matches exist (run generation stub if needed). <br> 2. In Scheduler, click "Schedule" button for a match. <br> 3. Select Date, Time, and an available Court. <br> 4. Save. | Dialog closes. Table updates to show scheduled time and court name. `matches` table updated in DB. Notifications sent (in-app/email).                   |
| SCHED-03     | Manually Reschedule Match | 1. In Scheduler, click "Schedule" for an already scheduled match. <br> 2. Change Time and/or Court. <br> 3. Save.                                                 | Dialog closes. Table shows updated time/court. DB updated. Notifications sent.                                                                          |
| SCHED-04     | Unassign Court/Time       | 1. In Scheduler, click "Schedule" for a scheduled match. <br> 2. Clear Date/Time fields OR select "-- Unassign --" for Court. <br> 3. Save.                           | Dialog closes. Table shows "Not Scheduled" / "Not Assigned". DB fields updated (likely to NULL). Optional: Notifications sent? (Consider if needed). |

---

## 6. Digital Scoring

**Goal:** Verify the scoring interface functionality, including basic score updates and persistence.

| Test Case ID | Scenario                  | Steps                                                                                                                                                                                                                            | Expected Result                                                                                                                                                           |
| :----------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SCORE-01     | Access Scoring Interface  | 1. Log in (Admin/Scorekeeper role). <br> 2. Navigate to a *scheduled* match (e.g., via Schedule tab or dedicated Scoring section). <br> 3. Initiate scoring for the match.                                                        | `ScoringInterface` component loads, displaying initial score (0-0), Set 1, and participant names (placeholders ok).                                                        |
| SCORE-02     | Score Points              | 1. In Scoring Interface, click "+ Point" button for Player/Team 1. <br> 2. Click "+ Point" for Player/Team 2 multiple times.                                                                                                       | Score display updates immediately (optimistic update). Check console for async save messages.                                                                             |
| SCORE-03     | Score Persistence         | 1. Score some points (e.g., 3-2). <br> 2. Refresh the browser page. <br> 3. Re-access the scoring interface for the same match.                                                                                                   | Scoring interface loads with the previously saved score (3-2), fetched from DB via the store's persisted state or initial fetch.                                          |
| SCORE-04     | Realtime Score Update     | 1. Open Scoring Interface in Window A. <br> 2. Open another view showing the match score (e.g., Player Dashboard if applicable, or DB Studio) in Window B. <br> 3. Score points in Window A.                                         | Score updates in Window B automatically (due to realtime subscription).                                                                                                  |
| SCORE-05     | Offline Scoring (Basic)   | 1. Open Scoring Interface. <br> 2. Use browser Dev Tools to switch Network to "Offline". <br> 3. Score a point. <br> 4. Switch Network back to "Online".                                                                          | UI updates optimistically when offline. Offline toast appears. Online toast appears on reconnect. Data re-fetches. **Note:** Check console/DB to see if update eventually saved. |
| SCORE-06     | Completed Match Scoring   | 1. Manually set a match status to 'completed' in DB. <br> 2. Attempt to score points via the UI.                                                                                                                                  | Scoring buttons should be disabled or scoring attempts should be rejected (e.g., with a toast message).                                                                    |

---

## 7. Player Experience Portal

**Goal:** Verify player-facing dashboard features.

| Test Case ID | Scenario                 | Steps                                                                                                                                                             | Expected Result                                                                                                                                    |
| :----------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| PXP-01       | View Dashboard           | 1. Log in as Player. <br> 2. Navigate to the main dashboard URL.                                                                                                 | `PlayerDashboard` component loads.                                                                                                                  |
| PXP-02       | View Upcoming Matches    | 1. Ensure player has upcoming scheduled matches (use SCHED-02). <br> 2. View Player Dashboard.                                                                      | "Upcoming Matches" card displays correct matches, sorted by time, showing opponent (name/placeholder), time, court (name/placeholder).                 |
| PXP-03       | View Match History       | 1. Ensure player has completed matches (score/complete via UI or DB). <br> 2. View Player Dashboard.                                                               | "Match History" card displays completed matches, sorted by date, showing opponent, score, and correct Win/Loss badge.                                |
| PXP-04       | View Statistics          | 1. View Player Dashboard. <br> 2. Check "My Statistics" card.                                                                                                    | Stats card displays values from `user.player_stats` (Matches Played/Won, Win Rate %, Rating etc.). **Note:** Verify stats update after PXP-03 completion. |
| PXP-05       | Realtime Schedule Update | 1. Open Player Dashboard in Window A. <br> 2. As Admin in Window B, reschedule one of the player's upcoming matches (use SCHED-03).                                 | Upcoming Matches list in Window A updates automatically to show the new time/court.                                                               |

---

## 8. Tournament Chat

**Goal:** Verify basic real-time chat functionality within a tournament context.

| Test Case ID | Scenario                  | Steps                                                                                                                                                                                                                                 | Expected Result                                                                                                                                                                      |
| :----------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CHAT-01      | View Chat                 | 1. Log in (Player or Admin). <br> 2. Navigate to a Tournament Detail page. <br> 3. Find and open the Chat interface/tab.                                                                                                                | `TournamentChat` component loads, showing "Loading" or existing messages. Input field visible.                                                                                      |
| CHAT-02      | Send Message              | 1. In Chat interface, type a message in the input field. <br> 2. Click Send button.                                                                                                                                                  | Message appears immediately in the chat list (styled as sender). Input field clears. Message saved to `tournament_messages` table in DB.                                              |
| CHAT-03      | Receive Message Realtime  | 1. Open Chat interface for the same tournament as User A in Window A. <br> 2. Log in as User B in Window B and open the same Chat interface. <br> 3. User B sends a message.                                                           | Message sent by User B appears automatically in User A's chat list in Window A without refresh (styled as receiver).                                                                |
| CHAT-04      | Load History              | 1. Send several messages. <br> 2. Close and reopen the Chat interface (or refresh page).                                                                                                                                             | Previously sent messages are loaded and displayed correctly in chronological order.                                                                                                   |

--- 