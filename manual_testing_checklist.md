# Manual Testing Checklist - Registration System

Server running at: http://localhost:8081/

## 1. Basic Setup Testing
- [X] Log in as an admin/organizer
- [ ] Navigate to the registration management page
- [ ] Verify the page loads without errors
- [ ] Check if the registration list is populated

## 2. Registration Management (Task 5.3)
### List View Features
- [ ] Test filtering:
  - [ ] Filter by registration status (Pending/Approved/Rejected/Waitlist)
  - [ ] Search by player name
  - [ ] Filter by division
- [ ] Test sorting:
  - [ ] Sort by registration date
  - [ ] Sort by player name
  - [ ] Sort by status
  - [ ] Sort by priority

### Bulk Actions
- [ ] Test bulk selection:
  - [ ] Select multiple registrations
  - [ ] Select all registrations
  - [ ] Deselect all
- [ ] Test bulk operations:
  - [ ] Approve multiple registrations
  - [ ] Reject multiple registrations
  - [ ] Move multiple to waitlist
  - [ ] Update priority for multiple registrations

### Individual Registration Management
- [ ] View registration details
- [ ] Update registration status
- [ ] Add/edit notes
- [ ] Update priority
- [ ] View player information
- [ ] Check emergency contact details
- [ ] Verify payment status

### Waitlist Management
- [ ] Add player to waitlist
- [ ] Set waitlist position
- [ ] Move from waitlist to approved
- [ ] Update waitlist priority

## 3. Digital Check-in System (Task 5.4)
### QR Code System
- [ ] Generate QR code for a registration
- [ ] Test QR code scanning
- [ ] Verify QR code contains correct registration data
- [ ] Test QR code download

### Check-in Process
- [ ] Scan valid QR code for check-in
- [ ] Try scanning invalid/expired QR code
- [ ] Manual check-in without QR code
- [ ] Verify check-in timestamp is recorded
- [ ] Test check-in status updates in real-time

### Status Tracking
- [ ] Monitor check-in status changes
- [ ] View list of checked-in participants
- [ ] View list of pending check-ins
- [ ] Test status filters in the check-in view
- [ ] Verify real-time updates of check-in status

## 4. Error Handling
- [ ] Test with invalid QR codes
- [ ] Test with expired registrations
- [ ] Test with already checked-in participants
- [ ] Verify error messages are clear and helpful
- [ ] Check network error handling

## 5. Mobile Responsiveness
- [ ] Test registration management on mobile
- [ ] Test QR code scanning on mobile
- [ ] Verify UI is usable on different screen sizes
- [ ] Check touch interactions for mobile users

## Testing Notes
1. Start with a fresh database state
2. Create test registrations with various statuses
3. Test each feature in isolation
4. Test common user flows end-to-end
5. Document any bugs or issues found below

## Issues Found
<!-- Add any bugs or issues discovered during testing here -->
1. Multiple GoTrueClient instances warning in console (not critical, but should be fixed)
2. React Router Future Flag warnings for v7 compatibility
3. Admin demo login error: Cannot read properties of undefined (reading 'includes') in DemoStorageService.ts
4. Sample tournament creation failing during demo login

## Additional Notes
<!-- Add any additional observations or suggestions here -->
1. Need to fix demo data initialization in DemoStorageService.ts
2. Consider adding React Router future flags for v7 compatibility:
   - Add `v7_startTransition` flag
   - Add `v7_relativeSplatPath` flag
3. Investigate why multiple GoTrueClient instances are being created
4. Current focus should be on fixing the demo data initialization before proceeding with feature testing

Next Steps:
1. Fix the demo data initialization error in DemoStorageService.ts
2. Verify sample tournament creation after fix
3. Then proceed with registration management testing 