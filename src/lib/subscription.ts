import { supabase } from './supabase';

const TRIAL_DAYS = 14;

export type AccessStatus = 'loading' | 'trial' | 'subscribed' | 'expired';

export async function checkAccessStatus(userId: string): Promise<Exclude<AccessStatus, 'loading'>> {
  // Check trial window first (local DB — no Stripe call needed)
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_started_at')
    .eq('id', userId)
    .single();

  if (!profile) return 'expired';

  const trialEnd = new Date(profile.trial_started_at);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  if (new Date() < trialEnd) return 'trial';

  // Trial expired — ask Stripe directly if they have an active subscription
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      }
    );

    if (!res.ok) return 'expired';

    const { subscribed } = await res.json() as { subscribed: boolean };
    return subscribed ? 'subscribed' : 'expired';
  } catch {
    // If Stripe check fails, fail closed (show paywall)
    return 'expired';
  }
}
