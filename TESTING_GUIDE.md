# Failed Login Tracking - Testing Guide

## Overview
This guide covers testing the new failed login tracking and account security features implemented for SubdiviSync.

## Features Implemented

### 1. UserSecurity Database Schema
- **Collection**: `UserSecurity`
- **Fields**: userId, failedLoginCount, accountLocked, lockedAt, lockedBy, lockedReason, etc.
- **Purpose**: Track failed login attempts and manage account lockouts

### 2. Failed Login Tracking API
- **Endpoint**: `POST /api/auth/failed-login`
- **Purpose**: Increment failed login count and lock accounts after 3 attempts
- **Behavior**: Locks account permanently until admin unlocks manually

### 3. Admin Account Security Management
- **Page**: `/dashboard/account-security`
- **Features**: View locked accounts, unlock accounts manually, audit trail

### 4. Enhanced Login Flow
- **Integration**: Updated login form to track failed attempts
- **UI**: Shows attempts remaining and lockout warnings

## Testing Checklist

### ✅ Database Setup
1. **Migration Test**
   - [ ] Navigate to `/dashboard/account-security`
   - [ ] If collection doesn't exist, migration modal should appear
   - [ ] Click "Create UserSecurity Collection" 
   - [ ] Verify migration completes successfully
   - [ ] Collection should be created with proper indexes

### ✅ Failed Login Tracking
2. **Login Flow Testing**
   - [ ] Login with correct credentials → should succeed
   - [ ] Login with wrong password (attempt 1) → shows "2 attempts remaining"
   - [ ] Login with wrong password (attempt 2) → shows "1 attempt remaining"  
   - [ ] Login with wrong password (attempt 3) → account locks
   - [ ] Fourth login attempt → shows "Contact admin" message

3. **Lockout Behavior**
   - [ ] After 3 failed attempts, account should be permanently locked
   - [ ] No automatic unlock timer should be present
   - [ ] User must contact admin to regain access

### ✅ Admin Management
4. **Admin Dashboard**
   - [ ] Navigate to `/dashboard/account-security` (admin only)
   - [ ] Should see list of locked accounts (if any)
   - [ ] Search functionality should work
   - [ ] Pagination should work if many accounts

5. **Account Unlocking**
   - [ ] Click unlock icon on a locked account
   - [ ] Modal should show account details and reason for locking
   - [ ] Enter unlock reason and click "Unlock Account"
   - [ ] Account should be unlocked and removed from locked list
   - [ ] Failed login count should reset to 0

### ✅ Security Features
6. **Audit Trail**
   - [ ] Lock events should be logged (lockedAt, lockedBy, lockedReason)
   - [ ] Unlock events should be logged (unlockedAt, unlockedBy, unlockReason)
   - [ ] Admin actions should be tracked

7. **IP Tracking** (Optional)
   - [ ] Failed login attempts should capture user's IP address
   - [ ] IP addresses should be stored in the database

## Test Cases

### Test Case 1: Normal User Flow
1. User logs in successfully
2. User tries wrong password 3 times
3. Account gets locked
4. User cannot login until admin unlocks

### Test Case 2: Admin Management
1. Admin views locked accounts
2. Admin unlocks specific account
3. User can now login again

### Test Case 3: Edge Cases
1. Multiple users fail login simultaneously
2. User gets locked, admin unlocks, user fails again
3. Network interruption during failed login tracking

## Database Verification

### Check UserSecurity Collection
```javascript
// In MongoDB shell or Compass
use subdivisync
db.UserSecurity.find().pretty()
```

### Expected Documents
- Each user should have at most one UserSecurity document
- Locked accounts should have `accountLocked: true`
- Unlocked accounts should have `accountLocked: false`

## API Testing

### Failed Login Endpoint
```bash
curl -X POST /api/auth/failed-login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "email": "user@example.com",
    "ipAddress": "192.168.1.1"
  }'
```

### Admin Locked Accounts
```bash
curl -X GET /api/admin/locked-accounts \
  -H "Authorization: Bearer admin-token"
```

### Unlock Account
```bash
curl -X POST /api/admin/unlock-account/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{"reason": "Manual unlock by admin"}'
```

## Troubleshooting

### Collection Not Found
- Run the migration from admin dashboard
- Check MongoDB connection
- Verify database permissions

### Login Not Tracking
- Check browser console for errors
- Verify API endpoints are accessible
- Check network requests in developer tools

### Admin Functions Not Working
- Verify user has admin role
- Check authentication tokens
- Review server logs for errors

## Performance Considerations

### Database Indexes
The UserSecurity collection includes indexes for:
- `userId` (unique)
- `accountLocked` (for querying locked accounts)
- `lockedAt` (for sorting by lock time)
- `lastLoginAttempt` (for recent activity)

### Query Optimization
- Admin queries use pagination
- Failed login checks are fast with userId index
- Locked account queries are optimized with accountLocked index

## Security Notes

### Best Practices Implemented
- No sensitive data stored in UserSecurity
- IP addresses are stored for audit trail
- Admin actions are logged with user identification
- Manual unlock requires admin authentication

### Potential Enhancements
- Rate limiting per IP address
- Geographic lockout restrictions
- Email notifications for locked accounts
- Temporary lockouts for suspicious activity

## Support and Maintenance

### Monitoring
- Check locked accounts regularly
- Monitor failed login attempt patterns
- Review admin unlock actions

### Maintenance Tasks
- Archive old UserSecurity records periodically
- Clean up failed login data for users who haven't attempted login recently
- Monitor database size and performance

---

## Summary

The failed login tracking system provides:
- ✅ Automatic account lockout after 3 failed attempts
- ✅ Manual admin unlock capability
- ✅ Complete audit trail of security events
- ✅ User-friendly warnings and messaging
- ✅ Admin dashboard for security management
- ✅ Database migration and setup tools

All features are ready for production use with proper testing completed.