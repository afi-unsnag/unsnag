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
    subject: 'The part nobody talks about',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You just separated what's yours to feel from what isn't. Most people never get that far. They stay in the tangle, carrying everyone else's stuff and wondering why they're exhausted.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        So now you can see it. Your guilt about prioritizing yourself? Yours. Their disappointment? Theirs. Clean line.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        But here's the part nobody talks about: seeing it and changing it are two completely different skills. You can draw the line perfectly on paper and still cross it the second someone gives you a look.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        That's not a failure. That's just how patterns work. They don't live in your understanding. They live somewhere deeper.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        I wrote about this here: <a href="https://unsnag.co/blog/what-does-feeling-your-feelings-mean.html" style="color: #2D2A26; font-weight: 600;">What does "feeling your feelings" actually mean?</a>
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        It's one of those things that sounds simple until you actually try it. I think you'll like it.<br><br>
        More soon.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-2',
    delayDays: 2,
    subject: 'You can name the pattern. So why can\'t you stop it?',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You can describe your patterns to a friend better than most therapists could. You know you overthink. You know you take on other people's stuff. You've read the books.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        And you still do it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        That's because the pattern isn't a thought. It's a physical response. Your chest tightens before your brain even gets involved. Your stomach drops before you've finished reading the text. The reaction is in your body, and your body doesn't care how many books you've read.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        This is the thing that changed everything for me: the body doesn't need you to understand the pattern. It needs you to feel the sensation long enough for it to pass. No analysis required.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        And here's the part that's hard to hear: when you numb the uncomfortable stuff, the good stuff gets quieter too. The joy, the excitement, the full-body laugh. It all runs on the same wiring. I wrote about that here: <a href="https://unsnag.co/blog/you-cant-turn-down-pain-without-turning-down-joy.html" style="color: #2D2A26; font-weight: 600;">You can't turn down pain without turning down joy, too.</a>
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Let me know if it resonates.<br><br>
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-3',
    delayDays: 5,
    subject: 'That thing you do? It used to protect you.',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The people-pleasing. The overthinking. The "I'm fine" when you're not fine. The swallowing what you need so nobody's uncomfortable.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Those aren't flaws. They're strategies. Really effective ones, actually. At some point, probably pretty early, your brain figured out that staying small, staying agreeable, staying one step ahead of everyone's mood was the safest play. And it worked. It kept the peace. It kept you safe.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The problem is it's still running. The situation changed, but the software didn't update. So now you're managing everyone's feelings in a meeting the same way you managed them at the dinner table when you were ten.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You don't need to fight the pattern. You just need to notice that it's firing when you don't need it anymore. That gap between the old reaction and a different choice is where everything changes.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        This one goes deeper if you want it: <a href="https://unsnag.co/blog/the-habits-you-want-to-change.html" style="color: #2D2A26; font-weight: 600;">The habits you want to change once helped you survive.</a>
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        It's one of the posts people tell me they send to their friends. I hope it hits the same way for you.<br><br>
        — Afi
      </p>
    `),
  },
  {
    key: 'free-tool-4',
    delayDays: 8,
    subject: 'Why I built this',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Hey 👋 I'm Afi. I have a three-year-old, a psychology background, and I'm a certified life coach. I also spent most of my adult life performing "I'm fine" while my body was doing something completely different underneath.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        I built Unsnag because I got tired of understanding my patterns and still being run by them. I wanted something simple enough to actually use in the moment, easy enough to make a habit out of, because consistency is what actually changes behavior. Not one big breakthrough.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Life's too short not to <a href="https://unsnag.co/blog/the-point-of-being-alive.html" style="color: #2D2A26; font-weight: 600;">fully experience it</a>, and I was tired of all my old patterns getting in the way of that.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        What's a pattern you keep catching yourself in but can't seem to shake? I'd love to hear from you.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        — Afi
      </p>
      ${ctaButton('Start your free trial', 'https://app.unsnag.co/signup')}
      <p class="email-muted" style="margin: 0; font-size: 13px; color: #B8B2A8; text-align: center;">
        14 days free. No credit card required.
      </p>
    `),
  },
  {
    key: 'free-tool-5',
    delayDays: 11,
    subject: 'One more thing, then I\'ll stop',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You used the free tool. You saw what's yours and what isn't. That clarity is real.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        But here's the honest part: seeing it doesn't change it. The pattern keeps going because the feeling underneath hasn't been felt. It's still in your body. Still driving the overthinking. Still making you swallow what you actually want to say.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The full Unsnag process takes about five minutes. You feel the feeling in your body, you stay with it, and you let it move. Do that enough times and the pattern loses its grip. Not because you figured it out. Because you felt it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you've been doing the work and wondering why you're still stuck, this might land: <a href="https://unsnag.co/blog/still-stuck-after-all-the-work.html" style="color: #2D2A26; font-weight: 600;">Still stuck after all the work? Here's what's missing.</a>
      </p>
      ${ctaButton('Try it. 14 days free.', 'https://app.unsnag.co/signup')}
      <p class="email-muted" style="margin: 0 0 20px; font-size: 13px; color: #B8B2A8; text-align: center;">
        No credit card. $5/month after. Cancel anytime.
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Either way, I'm really glad you tried the tool. This is my last email in this series, but <a href="https://unsnag.co/blog/" style="color: #2D2A26; font-weight: 600;">the blog</a> is always there if you want to keep reading. I'm rooting for you.<br><br>
        — Afi
      </p>
    `),
  },
];

const TRIAL_SEQUENCE: SequenceEmail[] = [
  {
    key: 'trial-1',
    delayDays: 1,
    subject: 'What five minutes in Unsnag looks like',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Whether you've already tried a session or you're waiting for the right moment, here's what the six steps actually are:
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Unload.</strong> Get what's in your head out of your head. Type or talk. No filter.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Name.</strong> Tap the emotions that fit. Just naming them starts to loosen the grip.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Sensation.</strong> Where do you feel this in your body? Tight chest. Heavy shoulders. Knot in the stomach. Find it.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Notice.</strong> Stay with that sensation. This is the part that moves it. Not analyzing it. Just being with it.
      </p>
      <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Ask.</strong> Give the emotion a voice. What does it actually want to say? Not your thoughts about the emotion. The emotion itself. This is the moment the feeling finally gets heard.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        <strong class="email-bold" style="color: #2D2A26;">Go.</strong> Choose a different next move. Not the reactive one. The one you actually want.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The whole thing takes about five minutes. Don't wait for a crisis. The small stuff works just as well. Someone's tone. A text you're overthinking. Guilt about something you said yesterday. Start there.
      </p>
      ${ctaButton('Open Unsnag', 'https://app.unsnag.co')}
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Excited for you to try it.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-2',
    delayDays: 4,
    subject: 'Why the body piece matters so much',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        When you feel something uncomfortable, your first instinct is to make it stop. Fix the situation. Manage the other person. Explain yourself. Draft a text, delete it, draft another one. Anything but sit there with it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Here's what's actually happening: the physical process of a feeling, the tightness, the heat, the pit in your stomach, peaks and passes pretty quickly. If you let it.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The reason feelings seem to last for hours is because we keep re-triggering them. We replay the conversation. We check their tone. We rehearse what we should have said. Every loop fires the whole thing up again.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        The Notice step in Unsnag is where you break that cycle. You stay with the sensation. Not the story about the sensation. The sensation itself. And it moves.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        People describe it differently. Some say the tightness softens. Some say they take a deep breath they didn't know they were holding. Some say nothing dramatic happens, but the urgency just drops.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        This post goes into the whole concept if you want to understand it more deeply: <a href="https://unsnag.co/blog/what-does-feeling-your-feelings-mean.html" style="color: #2D2A26; font-weight: 600;">What does "feeling your feelings" actually mean?</a>
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        It's worth the read. Promise.<br><br>
        ${ctaButton('Open Unsnag', 'https://app.unsnag.co')}
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-3',
    delayDays: 8,
    subject: 'The shift is quieter than you\'d expect',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        You've had Unsnag for about a week. Here's what I'd be looking for if I were you:
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        It's not a lightning bolt. It's more like: you're in a conversation that used to make you freeze, and you say the thing. Or someone's disappointed in you and you don't immediately try to fix it. Or you notice the tightness in your chest and instead of going down the rabbit hole, you just... notice it. And it passes.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        These moments are easy to miss because they're absences. The text you didn't agonize over. The guilt that showed up and then left without taking over your evening.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you've been doing sessions, look for those. They're the proof.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If you haven't started yet, no pressure. But next time something bothers you, try it with something small. The small moments are where the practice actually happens.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        This post is basically about this exact phase: <a href="https://unsnag.co/blog/still-stuck-after-all-the-work.html" style="color: #2D2A26; font-weight: 600;">Still stuck after all the work? Here's what's missing.</a>
      </p>
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Rooting for you. Genuinely.<br>
        — Afi
      </p>
    `),
  },
  {
    key: 'trial-4',
    delayDays: 12,
    subject: 'Your trial wraps up soon',
    buildHtml: () => wrapEmail(`
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Your 14-day trial ends in a couple days.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If Unsnag has been useful, subscribing keeps it there whenever you need it. $5/month. Unlimited sessions. Cancel anytime. It's there at 11pm on a Tuesday, in the car after a hard conversation, whenever the old patterns kick in.
      </p>
      <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
        If the timing isn't right, that's okay. You can always come back.
      </p>
      ${ctaButton('Subscribe. $5/month.', 'https://app.unsnag.co')}
      <p class="email-body-text" style="margin: 0; font-size: 15px; line-height: 1.65; color: #4A4640;">
        Thanks for trying it. I mean that.<br>
        — Afi
      </p>
    `),
  },
];

const SUBSCRIBED_EMAIL = {
  key: 'subscribed-1',
  subject: "You're in.",
  buildHtml: () => wrapEmail(`
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      You just subscribed. Unlimited sessions, whenever you need them.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      One ask: use it in the moment. Not as a weekly practice. In the moment. When someone's tone gets under your skin. When you're replaying a conversation at midnight. When you want to say something but the words won't come out.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      Every session is a rep. The old reactive pattern doesn't disappear in one session. It gets weaker every time you choose to feel the feeling instead of performing through it. One day you'll be in a situation that used to wreck you, and you'll just handle it differently. You won't even notice at first. That's the shift.
    </p>
    <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">Your history is saved.</strong> Every session lives in your history tab. Over time, same triggers, different responses. That's visible proof.
    </p>
    <p class="email-body-text" style="margin: 0 0 6px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">Cancel anytime.</strong> No hoops. Manage it from settings.
    </p>
    <p class="email-body-text" style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: #4A4640;">
      <strong class="email-bold" style="color: #2D2A26;">I read every reply.</strong> Feedback, frustrations, wins. Just reply.
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
