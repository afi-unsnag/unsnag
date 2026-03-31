import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('No signature', { status: 400 });

  const body = await req.text();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-04-10',
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  // Use service role — webhook runs server-side, bypasses RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
      })
      .eq('stripe_customer_id', customerId);
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_status: 'canceled',
      })
      .eq('stripe_customer_id', customerId);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
