-- Blog posts table for dynamic index page
-- The blog HTML files live on Netlify as static files
-- This table controls which ones appear on the index

create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  tag text not null check (tag in ('Feelings', 'Patterns', 'Identity', 'Unsnag')),
  published_date date not null,
  published boolean default false,
  created_at timestamptz default now()
);

-- Allow anonymous reads (the blog index fetches this)
alter table public.blog_posts enable row level security;

create policy "Anyone can read published posts"
  on public.blog_posts for select
  using (true);

create policy "Allow inserts from anon"
  on public.blog_posts for insert
  with check (true);

-- Insert existing published posts
insert into public.blog_posts (slug, title, excerpt, tag, published_date, published) values
  ('you-cant-think-your-way-through-a-feeling', 'You can''t think your way through a feeling.', 'Thinking about a feeling isn''t the same as feeling it. Here''s what that actually means — and what to do instead.', 'Feelings', '2026-04-01', true),
  ('different-isnt-wrong', 'Different isn''t wrong. It''s the point.', 'You spent years trying to shave off the edges. But what if different was never the problem?', 'Identity', '2026-04-01', true),
  ('the-habits-you-want-to-change', 'The habits you want to change once helped you survive.', 'People-pleasing, overachieving, avoiding conflict — these weren''t personality flaws. They were brilliant survival tools.', 'Patterns', '2026-04-01', true),
  ('ai-should-expand-your-capacity', 'AI should expand your capacity — not replace your humanity.', 'AI is already here. The question isn''t whether to use it. It''s whether it makes you more human or less.', 'Unsnag', '2026-04-01', true),
  ('how-you-handle-your-feelings', 'The way you handle your feelings teaches your kid how to handle theirs.', 'Your kid doesn''t need a perfect parent. They need one who can stay present while things fall apart.', 'Patterns', '2026-04-01', true),
  ('the-point-of-being-alive', 'The point of being alive is to feel alive.', 'You''re not here to just manage life. You''re here to feel it.', 'Feelings', '2026-04-01', true),
  ('you-cant-turn-down-pain-without-turning-down-joy', 'You can''t turn down pain without turning down joy, too.', 'When you numb the hard stuff, the good stuff goes quiet too. Here''s how to turn the volume back up.', 'Feelings', '2026-04-01', true),
  ('what-you-want-shows-up-when-youre-ready', 'What you want shows up when you''re ready for it — on the inside.', 'You don''t create the life you want by rearranging stuff. You create it by shifting what''s underneath.', 'Identity', '2026-04-01', true),
  ('how-to-stop-people-pleasing', 'How to Stop People-Pleasing (Without Being a Jerk)', 'People-pleasing isn''t kindness — it''s a pattern. Here''s how to stop without losing yourself.', 'Patterns', '2026-04-07', true),
  ('still-stuck-after-all-the-work', 'Still Stuck After All the Work? Here''s What''s Missing.', 'You did the work. So why are you still stuck? The piece that''s been missing this whole time.', 'Feelings', '2026-04-10', false),
  ('what-does-feeling-your-feelings-mean', 'What Does "Feeling Your Feelings" Actually Mean?', 'It''s not about crying, journaling harder, or analyzing where the feeling came from.', 'Feelings', '2026-04-14', false),
  ('why-you-assume-everyone-is-mad', 'Why You Assume Everyone Is Mad at You', 'If you constantly assume people are upset with you, here''s where that comes from.', 'Patterns', '2026-04-17', false),
  ('the-90-second-rule', 'The 90-Second Rule: How Long a Feeling Actually Lasts', 'A feeling fully felt in your body lasts about 90 seconds. Everything after that is the story.', 'Feelings', '2026-04-21', false)
on conflict (slug) do nothing;
