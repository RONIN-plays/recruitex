# Real-Time User Monitoring System

## Overview
The real-time user monitoring system tracks all active users on the RecruitX platform and displays their activity in the Recruiter Portal. Only authenticated admins can access this monitoring dashboard.

## Features

### 1. User Activity Tracking
- **Login Tracking**: When any user (candidate or recruiter) logs in, their activity is recorded in Firestore
- **Session Management**: User activity is updated every 30 seconds to track continuous engagement
- **Logout Tracking**: When users log out, their status is updated to 'inactive'

### 2. Real-Time Dashboard (Recruiter Portal)
The "Live Monitoring" tab in the Recruiter Portal displays:

#### Statistics Cards
- **Active Candidates**: Number of candidates currently using the platform
- **Total Active Users**: Total count of all active users (candidates + recruiters)
- **Current Time**: Server timestamp for reference

#### Live User Table
Shows real-time data for all active users:
- User name and email
- Current status (active/inactive)
- Login time (relative, e.g., "5m ago")
- Last activity time (relative)
- Current page being viewed

### 3. Data Structure (Firestore)

#### userActivity Collection
```typescript
interface UserActivity {
  uid: string;                    // Firebase user ID
  email: string;                  // User email
  displayName?: string;           // User's display name
  userType: 'candidate' | 'recruiter'; // Type of user
  status: 'active' | 'inactive';  // Current status
  loginTime: Timestamp | null;    // When user logged in
  lastActivity: Timestamp | null; // Last activity timestamp
  currentPage?: string;           // Page user is currently on
  deviceInfo?: string;            // User agent/device info
  biometricId?: string;           // Biometric ID (for candidates)
}
```

## Implementation Details

### Files Created/Modified

#### 1. `src/utils/userActivityTracker.ts`
Utility functions for tracking user activity:
- `trackUserLogin()`: Records user login with metadata
- `setupActivityTracking()`: Sets up 30-second activity updates
- `trackUserLogout()`: Marks user as inactive
- `trackPageChange()`: Tracks page navigation

#### 2. `src/hooks/useRealtimeUsers.ts`
React hook for real-time user data:
- `useRealtimeUsers()`: Listens to Firestore updates and returns active users
- `useActiveUserCount()`: Returns total count of active users
- Automatically calculates time differences (e.g., "5m ago")

#### 3. `src/components/RecruiterPortal.tsx`
Updated with:
- Live Monitoring tab as default view
- Real-time user statistics display
- Live user activity table
- Loading and empty states

#### 4. `src/pages/Index.tsx`
Updated with:
- User tracking on login (candidates and recruiters)
- Proper logout handling with database updates
- useEffect cleanup for unmounting

### How It Works

1. **User Login**
   ```
   BiometricAuth/AdminLogin → Index.tsx
   → trackUserLogin() → Firestore (userActivity collection)
   ```

2. **Real-Time Monitoring**
   ```
   RecruiterPortal loads
   → useRealtimeUsers() hook
   → Firestore listener (onSnapshot)
   → Real-time updates to table
   ```

3. **Activity Updates**
   ```
   Every 30 seconds → updateDoc() → lastActivity timestamp updated
   ```

4. **User Logout**
   ```
   User clicks "Back to Home" 
   → handleLogout() 
   → trackUserLogout() 
   → Status changed to 'inactive' in Firestore
   ```

## Admin Access

Only users authenticated with the following credentials can access the monitoring dashboard:
- **Email**: `admin@gmail.com`
- **Password**: `admin@1234`

These are validated through Firebase Authentication.

## Real-Time Features

- **Live Updates**: Dashboard updates automatically as users log in/out
- **Activity Tracking**: Each user's last activity time is updated every 30 seconds
- **Zero Latency**: Uses Firestore's real-time listeners for instant updates
- **Responsive Design**: Works on all screen sizes

## Security Considerations

1. **Firestore Rules** (Should be configured in Firebase Console):
   ```javascript
   // Only authenticated users can read their own activity
   // Only admins can read all user activities
   // Write access restricted to app logic
   ```

2. **User Privacy**:
   - Passwords are never stored in activity logs
   - Biometric data is only stored locally or with user consent
   - Device info is captured for security auditing

## Future Enhancements

1. Export user activity reports
2. Filter users by type or status
3. Search functionality
4. Activity timeline per user
5. Custom time range filtering
6. Integration with performance metrics
7. Alert notifications for suspicious activity
8. User engagement analytics

## Troubleshooting

### No users appearing on dashboard
- Check if Firestore collection `userActivity` exists
- Verify Firestore connection and network
- Check browser console for errors

### Activity not updating
- Ensure 30-second update interval is working
- Check Firestore write permissions
- Verify user session is still active

### Timestamps showing "N/A"
- Ensure Firebase serverTimestamp() is functioning
- Check system time synchronization
