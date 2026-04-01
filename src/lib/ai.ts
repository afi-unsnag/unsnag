import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Send a message to the Anthropic API.
 * In development, uses the Vite proxy. In production, uses the Supabase edge function.
 */
export async function aiMessage(body: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<Response> {
  // In dev, the Vite proxy handles /api/anthropic/* — use it for simplicity
  if (import.meta.env.DEV) {
    return fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // In production, call the Supabase edge function
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${SUPABASE_URL}/functions/v1/ai-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
