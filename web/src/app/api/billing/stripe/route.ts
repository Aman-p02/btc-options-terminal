import { NextRequest, NextResponse } from 'next/server';

/**
 * Stripe Webhook Handler (Secondary payment gateway for International cards).
 * Handles checkout.session.completed, customer.subscription.deleted, invoice.payment_failed.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_terminal_2026';

    const event = JSON.parse(rawBody);

    // Audit log
    console.log(JSON.stringify({
      audit_event: 'BILLING_WEBHOOK_RECEIVED',
      gateway: 'stripe',
      event_type: event.type,
      timestamp: new Date().toISOString(),
      customer_id: event?.data?.object?.customer,
    }));

    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`[Billing Audit] Stripe session completed for user ${event?.data?.object?.client_reference_id}`);
        break;
      case 'customer.subscription.deleted':
        console.log(`[Billing Audit] Stripe subscription cancelled for customer ${event?.data?.object?.customer}`);
        break;
      case 'invoice.payment_failed':
        console.log(`[Billing Audit] Stripe invoice payment failed for customer ${event?.data?.object?.customer}`);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

