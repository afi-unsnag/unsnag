import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Nurture Email Cron Function
 *
 * Runs daily (via Supabase cron or external trigger).
 * Checks leads and trial users, sends the right email at the right time.
 *
 * Two sequences:
 *   1. free-tool: 5 emails over 11 days (for /yours tool leads)
 *   2. trial: 4 emails over 12 days (for app signups, after welcome email)
 *
 * Logic:
 *   - Free-tool sequence STOPS if the lead starts a trial (email exists in auth.users)
 *   - Trial sequence STOPS if the user subscribes (stripe_subscription_status = 'active')
 *   - Unsubscribed leads are skipped
 *   - Each email is sent at most once per recipient (unique constraint on email + email_key)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Sequence Definitions ────────────────────────────────────

interface SequenceEmail {
  key: string;
  delayDays: number;
  subject: string;
  buildHtml: () => string;
}

const FREE_TOOL_SEQUENCE: SequenceEmail[] = [
  {
    key: 'free-tool-1',
    delayDays: 0,
    subject: "Here's what just happened",
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        You just did something most people don't.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You looked at a situation that was bothering you and separated out what's actually yours to feel from what you've been carrying for someone else.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        That distinction is everything. Because most of what's been keeping you stuck — the overthinking, the guilt, the "what did I do wrong" — is a tangle of your feelings mixed in with feelings that were never yours to begin with.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Their disappointment? Theirs.</strong> Your fear of their disappointment? That's yours — and it's worth sitting with.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The tool you just used — Yours or Not — is one piece of a 6-step process called Unsnag. Over the next few emails, I'll show you the rest — and why seeing the separation is powerful, but it's not enough to actually change the pattern.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        More soon.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-2',
    delayDays: 2,
    subject: 'Why you can see it but can\'t stop doing it',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Seeing it doesn't stop it. Here's why.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You've probably had this experience: you can see the pattern. You know you're overthinking. You know you're taking on someone else's stuff. You can describe it perfectly.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        And you do it anyway.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        That's not a discipline problem. It's because <strong class="email-bold" style="color: #2D2A26;">the pattern lives in your body, not your head</strong>. You've been trying to think your way out of something that isn't a thought — it's a feeling. A physical sensation. And it needs to be felt, not figured out.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        A feeling fully felt lasts about 90 seconds. That's it. But most of us never get there because we jump to fixing, explaining, or managing someone else's reaction instead.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Yours or Not showed you what's yours to feel. The full Unsnag process teaches you to actually feel it — in your body, for 90 seconds — so it moves through you and stops running your behavior.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Next time, I'll show you what that looks like with a real example.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-3',
    delayDays: 5,
    subject: 'The unanswered text (you know the one)',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Someone hasn't texted you back. It's been 4 hours.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        And you've already decided it's your fault. Maybe you said something wrong. Maybe you're too much. Maybe they're mad. You check your phone again. You replay the last conversation. You draft a follow-up and delete it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Here's what Yours or Not would show you:
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Yours to feel:</strong> The anxiety in your chest. The fear that you're annoying. The old pattern of needing to be liked to feel safe.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Not yours to feel:</strong> Why they haven't responded. Whether they're upset. What their silence means.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        That's useful. But it doesn't stop the spiral. What stops the spiral is feeling the anxiety in your chest — actually staying with it for 90 seconds — so it can move. That's what the full process does. Steps 1 through 6, about 5 minutes, and the grip loosens.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Do it enough times and you stop reaching for your phone to check. Not because you're forcing yourself — because the feeling doesn't have you anymore.
      </p>
      ${ctaButton('Try the full process — 14 days free', 'https://app.unsnag.co/signup')}
      <p class="email-muted" style="margin: 0 0 20px; font-size: 13px; color: #B8B2A8; text-align: center;">
        No credit card required
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-4',
    delayDays: 8,
    subject: 'Why I built this',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        I could explain every pattern I had. And I still fell apart over an unanswered text.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        I'm Afi. I built Unsnag. And I built it because I was exactly where you probably are — years of therapy, all the books, could articulate my patterns perfectly. And I was still people-pleasing, still overthinking, still second-guessing myself constantly. It was exhausting.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        What changed wasn't more understanding. It was getting out of my head and into my body. Actually feeling the feeling instead of thinking about it. Neuroscience shows that a feeling fully felt — the actual chemical process in your body — lasts about 90 seconds. Once I started doing that, everything shifted.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        I have a psychology background and I'm a certified life coach, but honestly? The thing that made me build this was becoming a mom. I have a three-year-old, and I don't want her to grow up carrying what I carried. If I can break this pattern in myself, I can stop passing it along. That felt urgent enough to build something.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        So Unsnag is that thing. 6 steps. About 5 minutes. Use it every time something gets under your skin. The more you do it, the less the old patterns run the show.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If any of this sounds familiar, I'd love for you to try it.<br>
        — Afi
      </p>
      ${ctaButton('Start your free trial', 'https://app.unsnag.co/signup')}
      <p class="email-muted" style="margin: 0; font-size: 13px; color: #B8B2A8; text-align: center;">
        14 days free · No credit card required
      </p>
    `),
  },
  {
    key: 'free-tool-5',
    delayDays: 11,
    subject: 'You\'ve seen what\'s yours. Ready to feel it?',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        One last thing.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You used Yours or Not. You saw what's yours to feel and what isn't. That clarity is real.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        But here's the honest truth: seeing it won't change it. The pattern keeps running because the feeling underneath hasn't been felt. It's still in your body, still driving the overthinking, still making you reach for your phone or swallow what you actually want to say.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The full Unsnag process takes about 5 minutes. You feel the feeling in your body, you stay with it for 90 seconds, and you let it move. Do that enough times and the pattern loses its grip. Not because you figured it out — because you felt it.
      </p>
      ${ctaButton('Try it — 14 days free', 'https://app.unsnag.co/signup')}
      <p class="email-muted" style="margin: 0 0 20px; font-size: 13px; color: #B8B2A8; text-align: center;">
        No credit card · $5/month after trial · Cancel anytime
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Either way, I'm glad you tried Yours or Not.<br>
        — Afi
      </p>
    `),
  },
];

const TRIAL_SEQUENCE: SequenceEmail[] = [
  {
    key: 'trial-1',
    delayDays: 1,
    subject: 'What a session looks like',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Here's what a session looks like.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Whether you've already tried your first session or you're waiting for the right moment — here's a quick overview of the 6 steps so you know what to expect:
      </p>
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">1. You'll unload what's in your head.</strong> Type or talk. No filter.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">2. You'll name the emotions.</strong> Just tap the ones that fit.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">3. You'll find it in your body.</strong> Where do you actually feel this?
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">4. You'll stay with it for 90 seconds.</strong> This is the part that moves it.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">5. You'll see what's yours to feel and what's not.</strong>
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">6. You'll choose a different next move.</strong>
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The whole thing takes about 5 minutes. Don't wait for a big moment — the small stuff works just as well.
      </p>
      ${ctaButton('Open Unsnag', 'https://app.unsnag.co')}
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-2',
    delayDays: 4,
    subject: 'The 90-second thing',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Why 90 seconds matters.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        When you feel something uncomfortable — guilt, anxiety, that pit in your stomach — your instinct is to make it stop. Fix the situation. Manage the other person. Explain yourself. Anything but sit there with it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        But here's what neuroscience shows: <strong class="email-bold" style="color: #2D2A26;">a feeling fully felt lasts about 90 seconds</strong>. The chemical process in your body — the cortisol, the adrenaline, the tightness — peaks and passes in under two minutes. If you let it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The reason feelings seem to last for hours (or days) is because we keep re-triggering them. We replay the conversation. We check their tone. We think about what we should have said. Every loop restarts the 90-second clock.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Step 4 in Unsnag — the Notice step — is where you just stay with the sensation in your body for 90 seconds. That's it. You don't fix it. You don't analyze it. You feel it. And it moves.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you haven't done a session yet, try it next time something's bothering you. If you have — you already know what I'm talking about.
      </p>
      ${ctaButton('Open Unsnag', 'https://app.unsnag.co')}
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-3',
    delayDays: 8,
    subject: 'Have you noticed anything?',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Quick check-in.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You've had Unsnag for about a week now. I wanted to check in.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you've been using it, you might've noticed something shift. Maybe a moment where you caught yourself about to spiral and didn't. Or a conversation where you said what you actually meant instead of what felt safe. Those are the signs.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you haven't used it yet — no pressure. But the next time something bothers you, try it. Even something small. The small stuff is where the practice happens.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The whole point of Unsnag is repetition. Every time you use it, the old reactive pattern loses a little more grip. It's not about one big session — it's about doing it over and over until the default changes.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Rooting for you.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-4',
    delayDays: 12,
    subject: 'Your trial ends in 2 days',
    buildHtml: () => wrapEmail(`
      <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
        Your free trial wraps up soon.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        In a couple days, your 14-day trial ends. I wanted to be straightforward about what that means:
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">If you subscribe ($5/month)</strong> — you keep full access. Unlimited sessions, whenever something's bothering you, cancel anytime.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">If you don't</strong> — you won't be able to start new sessions until you subscribe. If you'd like to delete your account, you can do that from your settings page.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        $5/month is less than one therapy co-pay. It's there every time you need it — at 11pm on a Tuesday, in the car after a hard conversation, whenever the spiral starts. No appointments, no waiting.
      </p>
      ${ctaButton('Subscribe — $5/month', 'https://app.unsnag.co')}
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Either way — thanks for trying it.<br>
        — Afi
      </p>
    `),
  },
];

const SUBSCRIBED_EMAIL = {
  key: 'subscribed-1',
  subject: "You're in.",
  buildHtml: () => wrapEmail(`
    <p class="email-heading" style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #2D2A26;">
      You're in. For real.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      You just subscribed to Unsnag. That means unlimited sessions, whenever you need them, for as long as you want.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      Here's the only thing I'd ask: <strong class="email-bold" style="color: #2D2A26;">use it.</strong> Not once a week as a wellness practice. Use it in the moment — when someone's tone gets under your skin, when you're replaying a conversation, when you want to say something but the words won't come out. That's when it works.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      Every time you use it, the old pattern loses a little more grip. You won't notice it right away. But one day you'll be in a situation that used to send you spiraling, and you'll just... handle it. Differently. That's the shift.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      A few things to know:
    </p>
    <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">Your history is saved.</strong> Every session lives in your history tab. Over time you'll see the same triggers showing up differently — that's the pattern losing its grip.
    </p>
    <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">Cancel anytime.</strong> No hoops, no retention tricks. You can manage your subscription from your settings page.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">I read every reply.</strong> If something's not working or you have feedback, just reply to this email.
    </p>
    ${ctaButton('Open Unsnag', 'https://app.unsnag.co')}
    <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
      Glad you're here.<br>
      — Afi
    </p>
  `),
};

// ── Email Template Helpers ──────────────────────────────────

function ctaButton(text: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="border-radius: 12px; background-color: #E2C6FD; border: 3px solid #2D2A26;">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #2D2A26; text-decoration: none;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function wrapEmail(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
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
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <h1 class="email-logo" style="margin: 0; font-size: 36px; font-weight: 700; color: #2D2A26; letter-spacing: -0.5px;">unsnag</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 48px; height: 4px; background-color: #E2C6FD; border-radius: 2px;"></div>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card" style="background-color: #FFFFFF; border: 3px solid #2D2A26; border-radius: 12px;">
                <tr>
                  <td style="padding: 36px 32px;">
                    ${bodyContent}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 28px;">
              <p class="email-muted" style="margin: 0 0 8px; font-size: 12px; color: #B8B2A8;">
                Unsnag · A guided app for getting out of your own head
              </p>
              <p style="margin: 0; font-size: 11px;">
                <a href="https://unsnag.co/unsubscribe?email=UNSUB_EMAIL" style="color: #B8B2A8; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Main Handler ────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify this is a cron call or authorized request
  const authHeader = req.headers.get('authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  // Allow: service role key, cron secret, or Supabase anon key (for manual triggers)
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    // Still allow if it has a valid authorization header (manual invoke)
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results = { sent: 0, skipped: 0, errors: 0, details: [] as string[] };

  try {
    // ── SEQUENCE 1: Free Tool Leads ──────────────────────

    // Get all non-unsubscribed leads
    const { data: leads } = await supabase
      .from('leads')
      .select('email, created_at')
      .eq('source', 'free-tool')
      .eq('unsubscribed', false);

    if (leads && leads.length > 0) {
      // Get all auth users (to check if a lead has started a trial)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const trialEmails = new Set(
        (authUsers?.users || []).map((u) => u.email?.toLowerCase()),
      );

      // Get already-sent nurture emails for these leads
      const leadEmails = leads.map((l) => l.email);
      const { data: sentEmails } = await supabase
        .from('nurture_emails')
        .select('email, email_key')
        .in('email', leadEmails)
        .eq('sequence', 'free-tool');

      const sentSet = new Set(
        (sentEmails || []).map((s) => `${s.email}::${s.email_key}`),
      );

      for (const lead of leads) {
        const email = lead.email.toLowerCase();
        const daysSinceCapture = daysBetween(new Date(lead.created_at), new Date());

        // If they've started a trial, skip the free-tool sequence
        if (trialEmails.has(email)) {
          continue;
        }

        // Find the next email to send
        for (const seqEmail of FREE_TOOL_SEQUENCE) {
          const sentKey = `${email}::${seqEmail.key}`;

          if (sentSet.has(sentKey)) continue; // Already sent
          if (daysSinceCapture < seqEmail.delayDays) break; // Not time yet — and no point checking later emails

          // Send it
          const html = seqEmail.buildHtml().replace(/UNSUB_EMAIL/g, encodeURIComponent(email));
          const success = await sendEmail(resendApiKey, email, seqEmail.subject, html);

          if (success) {
            await supabase.from('nurture_emails').insert({
              email,
              sequence: 'free-tool',
              email_key: seqEmail.key,
            });
            results.sent++;
            results.details.push(`Sent ${seqEmail.key} to ${email}`);
          } else {
            results.errors++;
          }

          break; // Only send one email per lead per run
        }
      }
    }

    // ── Fetch all auth users (used by trial + subscriber sections) ──
    const { data: authData } = await supabase.auth.admin.listUsers();
    const userMap = new Map<string, string>();
    for (const u of authData?.users || []) {
      if (u.email) userMap.set(u.id, u.email.toLowerCase());
    }

    // ── SEQUENCE 2: Trial Users ──────────────────────────

    // Get trial users: have trial_started_at but no active subscription
    const { data: trialUsers } = await supabase
      .from('profiles')
      .select('id, email:id, trial_started_at, stripe_subscription_status')
      .not('trial_started_at', 'is', null);

    if (trialUsers && trialUsers.length > 0) {

      // Get already-sent trial nurture emails
      const trialEmailAddresses = trialUsers
        .map((u) => userMap.get(u.id))
        .filter(Boolean) as string[];

      const { data: sentTrialEmails } = await supabase
        .from('nurture_emails')
        .select('email, email_key')
        .in('email', trialEmailAddresses)
        .eq('sequence', 'trial');

      const sentTrialSet = new Set(
        (sentTrialEmails || []).map((s) => `${s.email}::${s.email_key}`),
      );

      for (const user of trialUsers) {
        const email = userMap.get(user.id);
        if (!email) continue;

        // If they've subscribed, stop the trial sequence
        if (user.stripe_subscription_status === 'active') continue;

        const daysSinceTrial = daysBetween(
          new Date(user.trial_started_at),
          new Date(),
        );

        for (const seqEmail of TRIAL_SEQUENCE) {
          const sentKey = `${email}::${seqEmail.key}`;

          if (sentTrialSet.has(sentKey)) continue;
          if (daysSinceTrial < seqEmail.delayDays) break;

          const html = seqEmail.buildHtml().replace(/UNSUB_EMAIL/g, encodeURIComponent(email));
          const success = await sendEmail(resendApiKey, email, seqEmail.subject, html);

          if (success) {
            await supabase.from('nurture_emails').insert({
              email,
              sequence: 'trial',
              email_key: seqEmail.key,
            });
            results.sent++;
            results.details.push(`Sent ${seqEmail.key} to ${email}`);
          } else {
            results.errors++;
          }

          break; // One email per user per run
        }
      }
    }

    // ── SUBSCRIPTION CONFIRMATION ────────────────────────

    // Find subscribers who haven't received the confirmation email yet
    const { data: subscribers } = await supabase
      .from('profiles')
      .select('id, stripe_subscription_status')
      .eq('stripe_subscription_status', 'active');

    if (subscribers && subscribers.length > 0) {
      const subEmails: string[] = [];
      const subEmailMap = new Map<string, string>();
      for (const s of subscribers) {
        const email = userMap.get(s.id);
        if (email) {
          subEmailMap.set(s.id, email);
          subEmails.push(email);
        }
      }

      const { data: sentSubEmails } = await supabase
        .from('nurture_emails')
        .select('email')
        .in('email', subEmails)
        .eq('email_key', 'subscribed-1');

      const sentSubSet = new Set((sentSubEmails || []).map((s) => s.email));

      for (const [, email] of subEmailMap) {
        if (sentSubSet.has(email)) continue;

        const html = SUBSCRIBED_EMAIL.buildHtml().replace(/UNSUB_EMAIL/g, encodeURIComponent(email));
        const success = await sendEmail(resendApiKey, email, SUBSCRIBED_EMAIL.subject, html);

        if (success) {
          await supabase.from('nurture_emails').insert({
            email,
            sequence: 'subscribed',
            email_key: SUBSCRIBED_EMAIL.key,
          });
          results.sent++;
          results.details.push(`Sent subscribed-1 to ${email}`);
        } else {
          results.errors++;
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Nurture email error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message, ...results }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ── Utilities ───────────────────────────────────────────────

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Afi from Unsnag <afi@unsnag.co>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Failed to send to ${to}: ${err}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Send error for ${to}:`, err);
    return false;
  }
}
