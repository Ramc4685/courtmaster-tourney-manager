
# Multi-User Support & Live Updates

The Badminton Tournament Manager includes robust support for multi-user scenarios and live updates, enabling real-time collaboration between tournament administrators, scorekeepers, and public displays.

## Architecture

The application follows a publisher-subscriber pattern for real-time updates:

1. **Central State Management**:
   - Using React Context API for local state
   - Changes to tournament or match data trigger publications to subscribers

2. **Real-time Update Service**:
   - Handles communication between users
   - Maintains subscriptions to tournaments, matches, and in-progress matches
   - Resolves conflicts with timestamp-based versioning

3. **Optimistic UI Updates**:
   - Local state updated immediately for responsive UI
   - Confirmed by real-time service on successful broadcast
   - Conflicts resolved by comparing update timestamps

## Use Cases Supported

### 1. Multiple Scorekeepers

Multiple officials can score different matches simultaneously:

```
Scorekeeper A ──> Updates Match 1 ──┐
                                    ├──> Real-time Service ──> All Subscribed Clients
Scorekeeper B ──> Updates Match 2 ──┘
```

### 2. Public Display Screens

Tournament venues can display live scores on multiple screens:

```
Scorekeepers ──> Update Matches ──> Real-time Service ──> Public Displays
```

### 3. Administrative Changes

Tournament directors can make administrative changes visible to all users:

```
Admin ──> Updates Tournament Structure ──> Real-time Service ──> All Users
```

## Implementation Details

1. **Subscription Management**:
   - Clients subscribe to specific tournaments or matches
   - Unsubscribe when switching views or on component unmount

2. **Update Broadcasting**:
   - Updates include timestamps for conflict resolution
   - Batched updates for efficiency

3. **Error Handling**:
   - Network disconnect detection
   - Automatic reconnection with state synchronization
   - Conflict resolution favoring the most recent update

## Production Deployment Options

The current implementation works with the Vercel deployment and can be extended to:

1. **Firebase Realtime Database**:
   - Ideal for real-time communication
   - Built-in offline support

2. **Appwrite Realtime**:
   - Built-in real-time subscriptions
   - Compatible with current architecture

3. **WebSockets via Socket.io**:
   - For custom backend implementations
   - High-performance real-time communication

## Code Example

```typescript
// Example multi-user scoring implementation
const { match, updateMatchData, isConflict } = useRealtimeScoring(selectedMatch);

// Update score with real-time broadcasting
const handleScoreChange = (team, increment) => {
  const updatedMatch = {
    ...match,
    scores: [...calculateNewScores(team, increment)],
    updatedAt: new Date() // For conflict resolution
  };
  
  updateMatchData(updatedMatch); // Updates local state and broadcasts
};
```

The system is designed to gracefully handle concurrent updates and ensure all users see the latest state of the tournament and matches.
