# Payment Testing Guide

## ⚠️ IMPORTANT: The Issue You're Experiencing

Based on your logs, **you didn't complete the payment in PayMongo**. The status shows:
```
paymentIntentStatus: 'awaiting_payment_method'
payments: []
```

This means you closed the PayMongo checkout window WITHOUT paying!

---

## 🧪 How to Test Payments Properly

### Step 1: Complete the Payment in PayMongo

When you click "Pay Online":
1. ✅ PayMongo checkout opens in new tab
2. ✅ Select payment method (GCash, Card, etc.)
3. ⚠️ **COMPLETE THE PAYMENT** (don't close the window!)
4. ✅ Wait for PayMongo to redirect you back

### Step 2: Use PayMongo Test Cards

For testing, use these test card numbers:

**Successful Payment:**
- Card Number: `4343434343434345`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**Failed Payment:**
- Card Number: `4571736000000075`

### Step 3: For GCash Testing

PayMongo test mode provides a mock GCash flow:
1. Select GCash
2. You'll see a test payment page
3. Click "Authorize Payment"

---

## 🔍 Understanding the Logs

### ✅ Payment Created Successfully
```
PayMongo payment intent created: { id: 'pi_xxx', status: 'awaiting_payment_method' }
```
This is normal - payment is waiting for you to pay.

### ❌ You Didn't Pay
```
paymentIntentStatus: 'awaiting_payment_method'
payments: []
```
This means NO payment was made. You need to complete payment in PayMongo!

### ✅ Payment Successful (What you should see)
```
paymentIntentStatus: 'succeeded'
payments: [{ id: 'pay_xxx', status: 'paid' }]
```

---

## 🐛 Current Limitations

### Webhooks Don't Work on Localhost
PayMongo webhooks can't reach `http://localhost:3000`. This means:
- ❌ Real-time payment updates won't work
- ✅ Manual verification after redirect WILL work
- ✅ Production deployment will work perfectly

### Workaround for Testing
The system now checks:
1. Payment intent status
2. Recent payments list (last 50)
3. Checkout session status

This should catch your payment even without webhooks!

---

## 📝 Testing Checklist

- [ ] Start dev server: `npm run dev`
- [ ] Create/complete a service request
- [ ] Click "Pay Online"
- [ ] **IMPORTANT: Complete the payment in PayMongo** (don't just close it!)
- [ ] Wait for redirect back to localhost
- [ ] Check if payment status updates to "Paid"

---

## 🔧 If Payment Still Fails

1. **Check MongoDB directly:**
   ```
   Database: subdivisync
   Collection: service-requests
   Find: { _id: ObjectId("your-request-id") }
   Check: payment_status field
   ```

2. **Check server logs for:**
   ```
   ✓ Found payment pay_xxx for payment intent, status: paid
   ✓ Payment confirmed as successful!
   ```

3. **Verify environment variables:**
   ```
   PAYMONGO_SECRET_API_KEY=sk_test_xxx
   PAYMONGO_PUBLIC_API_KEY=pk_test_xxx
   ```

---

## 🚀 For Production

When deployed to production:
1. Update `.env` with production PayMongo keys
2. Configure webhook URL in PayMongo dashboard:
   ```
   https://www.subdivisync.online/api/webhooks/paymongo
   ```
3. Webhooks will work automatically!

---

## 💡 Quick Test Now

1. Go to service requests
2. Click "Pay Online" on a completed request
3. In PayMongo checkout, use test card: `4343434343434345`
4. Complete the payment (don't close the window!)
5. Wait for redirect
6. Payment should show as "Paid"

**The key is: YOU MUST COMPLETE THE PAYMENT, not just open and close the window!**
