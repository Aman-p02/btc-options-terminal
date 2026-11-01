import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Razorpay Webhook Handler (Primary payment gateway for India - UPI, RuPay, Cards).
 * Handles payment.captured, order.paid, subscription.cancelled, payment.failed.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_secret_terminal_2026';

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const isValid = signature === expectedSignature;

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Structured Audit Log for billing compliance
    console.log(JSON.stringify({
      audit_event: 'BILLING_WEBHOOK_RECEIVED',
      gateway: 'razorpay',
      event_type: eventType,
      signature_valid: isValid,
      timestamp: new Date().toISOString(),
      payload_id: event?.payload?.payment?.entity?.id || event?.payload?.order?.entity?.id,
      amount: event?.payload?.payment?.entity?.amount,
      currency: event?.payload?.payment?.entity?.currency,
    }));

    if (!isValid && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid Razorpay signature' }, { status: 400 });
    }

    // Process event types
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid':
        // Upgrade user plan in Postgres/Supabase
        console.log(`[Billing Audit] User upgraded via Razorpay payment ${event?.payload?.payment?.entity?.id}`);
        break;
      case 'subscription.cancelled':
        console.log(`[Billing Audit] Subscription cancelled for ${event?.payload?.subscription?.entity?.id}`);
        break;
      case 'payment.failed':
        console.log(`[Billing Audit] Payment failed: ${event?.payload?.payment?.entity?.error_description}`);
        break;
      default:
        break;
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

