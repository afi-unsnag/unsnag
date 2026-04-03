import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Debug: check what subscription statuses exist
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, stripe_subscription_status, stripe_customer_id, stripe_subscription_id');

    // Run all queries in parallel
    const [
      leadsResult,
      profilesResult,
      subscribersResult,
      sessionsResult,
      nurtureResult,
    ] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', 'free-tool'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('stripe_subscription_status', 'active'),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('nurture_emails').select('id', { count: 'exact', head: true }),
    ]);

    const subscribers = subscribersResult.count ?? 0;

    return new Response(JSON.stringify({
      freeToolLeads: leadsResult.count ?? 0,
      totalUsers: profilesResult.count ?? 0,
      activeSubscribers: subscribers,
      sessionsCompleted: sessionsResult.count ?? 0,
      nurtureEmailsSent: nurtureResult.count ?? 0,
      estMonthlyRevenue: subscribers * 5,
      _debug_profiles: allProfiles,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Dashboard metrics error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
