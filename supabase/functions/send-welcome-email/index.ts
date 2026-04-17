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
    // This function is called by a database webhook when email_confirmed_at is set
    const payload = await req.json();
    const { record } = payload;

    if (!record?.email || !record?.email_confirmed_at) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we already sent a welcome email (prevent duplicates)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('welcome_email_sent')
      .eq('id', record.id)
      .single();

    if (profile?.welcome_email_sent) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atomically claim this send — only proceeds if welcome_email_sent was false
    const { data: claimed } = await supabase
      .from('profiles')
      .update({ welcome_email_sent: true })
      .eq('id', record.id)
      .eq('welcome_email_sent', false)
      .select('id');

    if (!claimed || claimed.length === 0) {
      // Another invocation already claimed this — skip
      return new Response(JSON.stringify({ skipped: true, reason: 'already claimed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = record.raw_user_meta_data?.full_name?.split(' ')[0] || '';
    const greeting = firstName ? `Hey, ${firstName}!` : 'Hey!';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not set');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to Unsnag</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-card { background-color: #2D2A26 !important; border-color: #4A4640 !important; }
      .email-heading { color: #FAF7F2 !important; }
      .email-body-text { color: #E8E3DB !important; }
      .email-bold { color: #FAF7F2 !important; }
      .email-muted { color: #B8B2A8 !important; }
      .email-logo { color: #FAF7F2 !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #FAF7F2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <h1 class="email-logo" style="margin: 0; font-size: 36px; font-weight: 700; color: #2D2A26; letter-spacing: -0.5px;">
                unsnag
              </h1>
            </td>
          </tr>

          <!-- Accent line -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 48px; height: 4px; background-color: #E2C6FD; border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card" style="background-color: #FFFFFF; border: 3px solid #2D2A26; border-radius: 12px;">
                <tr>
                  <td style="padding: 36px 32px;">

                    <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
                      ${greeting} Welcome to Unsnag. ✨
                    </p>

                    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      You just decided to do something about the overthinking, the people-pleasing, the carrying everyone else's stuff. That matters.
                    </p>

                    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      Here's all you need to know:
                    </p>

                    <p class="email-body-text" style="margin: 0 0 8px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      <strong class="email-bold" style="color: #2D2A26;">Open it when something's bothering you.</strong> Someone's tone, an unanswered text, the panic before a hard conversation — that's when you use it.
                    </p>

                    <p class="email-body-text" style="margin: 0 0 8px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      <strong class="email-bold" style="color: #2D2A26;">Follow the 6 steps.</strong> They take about 5–8 minutes. No homework after.
                    </p>

                    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      <strong class="email-bold" style="color: #2D2A26;">Use it every time.</strong> The more you do it, the less the old patterns run the show. That's the whole thing.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #E2C6FD; border: 3px solid #2D2A26;">
                          <a href="https://app.unsnag.co" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #2D2A26; text-decoration: none;">
                            Open Unsnag
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      Bookmark <strong class="email-bold" style="color: #2D2A26;">app.unsnag.co</strong> so it's always easy to find.
                    </p>

                    <p class="email-body-text" style="margin: 16px 0 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
                      Glad you're here,<br>
                      — Afi<br>
                      <span class="email-muted" style="font-size: 13px; color: #B8B2A8;">Founder of Unsnag. Mostly retired people-pleaser.</span>
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 28px;">
              <p class="email-muted" style="margin: 0; font-size: 12px; color: #B8B2A8;">
                Unsnag · A guided app for getting out of your own head
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Afi from Unsnag <afi@unsnag.co>',
        to: [record.email],
        subject: `Welcome to Unsnag${firstName ? `, ${firstName}` : ''} 🫶`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Welcome email error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
