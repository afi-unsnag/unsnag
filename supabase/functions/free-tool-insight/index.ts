const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (per instance)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 5;

  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) return true;

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { situation, email } = await req.json();

    if (!situation || typeof situation !== 'string' || situation.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Please describe the situation in more detail.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Cap input length
    const trimmedSituation = situation.trim().slice(0, 2000);

    // If email provided, store it as a lead
    if (email && typeof email === 'string' && email.includes('@')) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        await fetch(`${supabaseUrl}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            source: 'free-tool',
            created_at: new Date().toISOString(),
          }),
        });
      } catch {
        // Don't block the AI response if lead storage fails
        console.error('Failed to store lead');
      }
    }

    // Call Anthropic (same provider as ai-message function)
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const systemPrompt = `You help people separate their own feelings from feelings they've absorbed from someone else.

This is the core idea: People who overthink and people-please often confuse other people's feelings for their own. They think "I feel disappointed for them" — but that disappointment is the other person's feeling, not theirs. What IS theirs is the fear, worry, or guilt they feel IN RESPONSE to the other person's situation.

"Yours to feel" — the feelings this person is ACTUALLY experiencing in response to the situation. Their fear, their worry, their guilt, their anxiety, their anger. These are real, they belong to this person, and they're worth sitting with and processing. This is not a criticism — it's an invitation to feel what's genuinely theirs.

"Not yours to feel" — the feelings this person has ABSORBED from someone else and is carrying as if they were their own. Someone else's disappointment, frustration, sadness, or anger. This person may think they're being empathetic by feeling these, but these feelings belong to the other person. This person can put them down.

The distinction: "I'm worried he's going to be upset" = yours to feel (that's YOUR worry). "He's disappointed about his day" = not yours to feel (that's HIS disappointment — you've absorbed it as your own, but it's not).

Important rules:
- Never describe, judge, or characterize another person — not negatively, not positively.
- No blame in either direction. Not "their guilt-tripping" — just "someone else's disappointment."
- "Yours to feel" items should name the person's actual emotion and what it's about. These are worth feeling and processing.
- "Not yours to feel" items should name someone else's feeling that this person has been carrying. Frame it as something they can put down.
- No therapy-speak. No "boundaries," "toxic," "trauma response," "self-care." Just plain, honest language.
- 3 items per list, each a short phrase (not a full sentence).

Return ONLY valid JSON with this exact structure and nothing else:
{"whatsYours": ["...", "...", "..."], "whatsNotYours": ["...", "...", "..."]}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: trimmedSituation }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic error:', errText);
      throw new Error('AI request failed');
    }

    const aiData = await anthropicRes.json();
    const text = aiData.content?.find((b: { type: string; text?: string }) => b.type === 'text')?.text ?? '';

    // Extract JSON even if wrapped in code fences
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('free-tool-insight error:', message);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
