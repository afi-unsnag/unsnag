import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AiInsightProps {
  onContinue: () => void;
  intakeTranscript?: string;
  askTranscript?: string;
  emotions: string[];
  sensations: string[];
  onSaveInsight?: (insight: InsightData) => void;
}

export interface InsightData {
  whatsYours: string[];
  whatsNotYours: string[];
  affirmation: string;
}

const SYSTEM_PROMPT = `You help people untangle what's theirs from what isn't.
Be direct, grounded, human. Not clinical. Not therapy-speak.
Like a sharp friend who can see the situation clearly.

Given someone's situation, emotions, body sensations, and inner voice — give a concise breakdown:

"What's yours" — their patterns, their role, feelings they can actually work with.
"What's not yours" — other people's reactions, their expectations, things outside their control.

Return ONLY valid JSON with this exact structure and nothing else:
{
  "whatsYours": ["phrase 1", "phrase 2", "phrase 3"],
  "whatsNotYours": ["phrase 1", "phrase 2", "phrase 3"],
  "affirmation": "one short closing line"
}

Each item is a short phrase, not a sentence. Max 4 items per category.
No therapy-speak. No "it's okay to feel..." Just be real.`;

function buildUserMessage(
  intakeTranscript?: string,
  askTranscript?: string,
  emotions?: string[],
  sensations?: string[]
): string {
  const parts: string[] = [];
  if (intakeTranscript) parts.push(`What's going on: ${intakeTranscript}`);
  if (emotions?.length) parts.push(`Emotions: ${emotions.join(', ')}`);
  if (sensations?.length) parts.push(`Body sensations: ${sensations.join(', ')}`);
  if (askTranscript) parts.push(`The inner voice said: ${askTranscript}`);
  return parts.join('\n\n') || 'No details provided.';
}

export function AiInsight({ onContinue, intakeTranscript, askTranscript, emotions, sensations, onSaveInsight }: AiInsightProps) {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: buildUserMessage(intakeTranscript, askTranscript, emotions, sensations),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errBody?.error?.message ?? `API error ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text?: string }> };
      if (cancelled) return;

      const text = data.content.find((b) => b.type === 'text')?.text ?? '';
      console.log('[AiInsight] raw response text:', text);

      // Pull the JSON object out even if Claude wraps it in prose or code fences
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Response had no JSON. Got: ${text.slice(0, 200)}`);

      const parsed = JSON.parse(jsonMatch[0]) as InsightData;
      console.log('[AiInsight] parsed:', parsed);
      if (!cancelled) {
        setInsight(parsed);
        onSaveInsight?.(parsed);
      }
    })().catch((err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AiInsight]', err);
      setError(msg);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading
  if (!insight && !error) {
    return (
      <motion.div
        className="flex flex-col items-center w-full max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}>
        <motion.h2 className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center mb-2">
          Let's untangle this.
        </motion.h2>
        <p className="font-body text-sm text-warm-gray text-center mb-10">
          Looking at what's yours vs. what isn't…
        </p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-mauve"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Error
  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center w-full max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        <h2 className="font-heading text-2xl font-bold text-warm-dark text-center mb-4">
          Couldn't load insight
        </h2>
        <p className="font-body text-sm text-warm-gray text-center mb-8 max-w-xs">{error}</p>
        <button
          onClick={onContinue}
          className="px-8 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve font-heading font-semibold text-base text-warm-dark shadow-chunky cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark">
          keep going anyway
        </button>
      </motion.div>
    );
  }

  // Result
  console.log('[AiInsight] rendering result', insight);
  return (
    <motion.div
      className="flex flex-col items-center w-full max-w-md mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}>

      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center mb-2">
        Let's untangle this.
      </h2>
      <p className="font-body text-sm text-warm-gray text-center mb-8">
        Here's what we're seeing.
      </p>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border-2 border-tomato bg-cream p-5">
          <h3 className="font-heading font-bold text-base text-tomato mb-3">What's yours</h3>
          <ul className="space-y-2.5">
            {(insight!.whatsYours ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tomato flex-shrink-0" />
                <span className="font-body text-sm text-warm-dark">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border-2 border-orange bg-cream p-5">
          <h3 className="font-heading font-bold text-base text-orange-dark mb-3">What's not yours</h3>
          <ul className="space-y-2.5">
            {(insight!.whatsNotYours ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                <span className="font-body text-sm text-warm-dark">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="font-body text-sm text-warm-dark-light text-center mb-8 max-w-xs italic">
        {insight!.affirmation}
      </p>

      <button
        onClick={onContinue}
        className="px-8 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve font-heading font-semibold text-base text-warm-dark shadow-chunky cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
        I see it now
      </button>
    </motion.div>
  );
}
