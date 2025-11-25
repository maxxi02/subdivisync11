# Payment Debugging Guide

## Why Payment Stays "awaiting_payment_method"

The payment intent status `awaiting_payment_method` means:
- ✅ Payment intent was created successfully
- ✅ Payment intent is stored in MongoDB
- ❌ User hasn't completed payment in PayMongo checkout yet
- OR webhook hasn't fired/processed

## Step-by-Step Debugging

### 1. Check if Payment Intent is Created
- Look in server logs for: `"PayMongo payment intent created"`
- Check MongoDB `service-requests` collection for `payment_intent_id` field

### 2. Check if User Completes Payment
- When user clicks "Pay Online", a new tab opens with PayMongo checkout
- User MUST:
  1. Select payment method (Card/GCash/GrabPay)
  2. Enter payment details
  3. Click "Pay" or "Confirm"
  4. Complete any 3D Secure/OTP verification
  5. See success page

### 3. Check Webhook Configuration
**CRITICAL**: Webhook must be configured in PayMongo Dashboard!

1. Go to PayMongo Dashboard → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/paymongo`
3. Select events:
   - `payment.paid`
   - `payment.failed`
   - `checkout_session.payment.paid`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 4. Check Webhook Logs
Look for these in server logs:
- `"=== PayMongo Webhook Received ==="`
- `"Event type: payment.paid"` or `"checkout_session.payment.paid"`

### 5. Common Issues

#### Issue 1: User Doesn't Complete Payment
- **Symptom**: Payment intent stays `awaiting_payment_method`
- **Solution**: User must complete payment in PayMongo checkout

#### Issue 2: Webhook Not Configured
- **Symptom**: Payment completes but database not updated
- **Solution**: Configure webhook in PayMongo dashboard

#### Issue 3: Webhook URL Wrong
- **Symptom**: Webhook never received
- **Solution**: Check webhook URL is accessible (not localhost in production)

#### Issue 4: Webhook Structure Mismatch
- **Symptom**: Webhook received but errors
- **Solution**: Check logs for webhook structure - we added detailed logging

## Testing Payment Flow

1. **Create Payment**:
   ```
   POST /api/create-payment
   ```
   - Should return `checkout_url` and `payment_intent_id`
   - Check MongoDB: `payment_intent_id` should be saved

2. **Complete Payment in PayMongo**:
   - Open `checkout_url` in browser
   - Complete payment with test card: `4242 4242 4242 4242`
   - Should redirect to `/payment-success`

3. **Check Webhook**:
   - Look for webhook logs
   - Check MongoDB: `payment_status` should be `"paid"`

4. **Verify Payment**:
   ```
   POST /api/create-payment/verify-payment
   ```
   - Should return `localStatus: "paid"`

## MongoDB Check

Query to check payment status:
```javascript
db.getCollection("service-requests").findOne(
  { _id: ObjectId("your-request-id") },
  { payment_intent_id: 1, payment_status: 1 }
)
```

## Next Steps

1. Check server logs when creating payment
2. Check server logs when webhook fires (if it does)
3. Verify webhook is configured in PayMongo dashboard
4. Test with PayMongo test card to ensure payment completes

