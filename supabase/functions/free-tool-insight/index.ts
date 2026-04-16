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

    const body = await req.json();
    const { situation, email, session_id, subscribe_only } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Subscribe-only path: post-result email capture, no new AI call
    if (subscribe_only) {
      if (email && typeof email === 'string' && email.includes('@')) {
        try {
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
          console.error('Failed to store lead');
        }
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const systemPrompt = `You help deeply empathetic people see the difference between their own reaction and someone else's experience.

This is the core idea: People who use this tool are deeply feeling. When someone around them is going through something difficult, they don't just notice — they feel it themselves. Someone's dad might feel lonely, so they feel the loneliness. Someone's mom might feel ashamed, so they feel the shame. It's real and physical for them, not performative.

But those feelings aren't theirs. They can't actually feel someone else's loneliness for them — that's the other person's experience to have or not have. What IS theirs is their own reaction: the guilt about prioritizing themselves, the fear of causing someone pain, the urge to freeze or shrink so nobody's uncomfortable.

"Yours to feel" — this person's actual reaction to the situation. Their guilt, their fear, their discomfort, their urge to fix or freeze. These are real, they belong to this person, and they're worth sitting with and processing. This is not a criticism — it's where they have agency.

"Not yours to feel" — the other person's experience. Their disappointment, their loneliness, their frustration, their mood. This person may think they're being empathetic by feeling these, but they can't feel them for someone else. That's the other person's experience to have. Framing: this is theirs, not yours to manage or fix.

Example: A person wants to move out but can't tell their dad because they assume he'll feel lonely and sad. "Yours to feel" = your guilt about prioritizing what you want, your fear of causing him pain, the urge to freeze instead of speaking up. "Not yours to feel" = his loneliness — that's his experience to have, his disappointment — that's his to process, how he reacts to your decision — not yours to manage.

Important rules:
- Never describe, judge, or characterize another person — not negatively, not positively.
- No blame in either direction. Not "their guilt-tripping" — just "their disappointment" or "their reaction."
- "Yours to feel" items should name the person's actual reaction — the emotion activating IN them. Worth sitting with.
- "Not yours to feel" items should name the other person's experience — frame each as "that's theirs to have/process, not yours to manage."
- The person can still be empathetic and kind — this isn't about not caring. It's about not stuffing their own needs because of feelings they're anticipating someone else might have.
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

    // Log the submission (situation + AI output) for product insight
    try {
      await fetch(`${supabaseUrl}/rest/v1/free_tool_submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          situation: trimmedSituation,
          whats_yours: parsed.whatsYours ?? null,
          whats_not_yours: parsed.whatsNotYours ?? null,
          email: email && typeof email === 'string' && email.includes('@')
            ? email.toLowerCase().trim()
            : null,
          session_id: typeof session_id === 'string' ? session_id.slice(0, 64) : null,
        }),
      });
    } catch {
      // Don't block the response if logging fails
      console.error('Failed to log submission');
    }

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
