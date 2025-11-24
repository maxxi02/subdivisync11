# Clear Security Records Scripts

## Option 1: Use the UI Button (Easiest) ⭐

1. **Go to Account Security page** (`/dashboard/account-security`)
2. **Click** the red **"Clear All Records"** button (top-right)
3. **Confirm** in the modal
4. **Done!** All UserSecurity records deleted

---

## Option 2: Run the Script from Terminal

### Prerequisites
- Node.js installed
- MongoDB connection string

### Steps

1. **Update the MongoDB URI** in `scripts/clear-security-records.js`:
   ```javascript
   const MONGODB_URI = process.env.MONGODB_URI || 'your-connection-string';
   ```

2. **Run the script**:
   ```bash
   node scripts/clear-security-records.js
   ```

3. **Wait 5 seconds** for the confirmation countdown
4. **All records deleted!**

---

## Option 3: MongoDB Compass / CLI

If you prefer direct database access:

### Using MongoDB Compass
1. Connect to your database
2. Find the `UserSecurity` collection
3. Click "Delete" → "Delete all documents"

### Using MongoDB CLI
```bash
mongosh "your-connection-string"

use your-database-name

db.usersecurities.deleteMany({})
```

---

## What Gets Deleted

When you clear all records, the following are permanently removed:
- ✅ All locked account records
- ✅ All failed login attempt counts
- ✅ All lock timestamps and history
- ✅ All unlock audit logs

After clearing:
- ✅ All users can log in again
- ✅ Failed login tracking starts fresh
- ✅ Clean database state for testing

---

## Safety Note

⚠️ **These operations cannot be undone!**

Make sure you:
- Have database backups if needed
- Are in a development/testing environment
- Actually want to delete all security records

---

## For Single Record Deletion

If you only want to delete specific records, use the **individual trash button** in the Actions column of the Account Security page instead of the "Clear All Records" button.


