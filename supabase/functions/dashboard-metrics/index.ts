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

    // Run all queries in parallel
    const [
      freeToolUsesResult,
      leadsResult,
      profilesResult,
      trialingResult,
      activeSubsResult,
      allSubsResult,
      sessionsResult,
    ] = await Promise.all([
      supabase.from('free_tool_submissions').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', 'free-tool'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('stripe_subscription_status', 'trialing'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('stripe_subscription_status', 'active'),
      // Also count incomplete/trialing as "has a subscription" (common in test mode)
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('stripe_subscription_id', 'is', null),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('completed', true),
    ]);

    // Use active count if available, otherwise fall back to anyone with a subscription ID
    const activeCount = activeSubsResult.count ?? 0;
    const totalWithSub = allSubsResult.count ?? 0;
    const subscribers = activeCount > 0 ? activeCount : totalWithSub;

    return new Response(JSON.stringify({
      freeToolUses: freeToolUsesResult.count ?? 0,
      leads: leadsResult.count ?? 0,
      totalUsers: profilesResult.count ?? 0,
      freeTrials: trialingResult.count ?? 0,
      activeSubscribers: subscribers,
      sessionsCompleted: sessionsResult.count ?? 0,
      estMonthlyRevenue: subscribers * 5,
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
