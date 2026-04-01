import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { aiMessage } from '../lib/ai';

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

const SYSTEM_PROMPT = `You help people get clear on what is and isn't theirs to carry.

This is not about blame — not toward them, and not toward anyone else. No one is the villain here.

This is purely about accountability: what belongs to this person to look at, own, and potentially do something about — and what belongs to someone else and is not theirs to manage, fix, or take responsibility for.

"What's yours to own" — their own feelings (even the uncomfortable ones), their own behaviors and reactions (especially the ones driven by wanting to avoid shame, guilt, or conflict), their own patterns. These are things they actually have agency over.

"What's not yours" — other people's feelings (their disappointment, discomfort, frustration, or anger), other people's reactions and choices, other people's opinions of them. These do not belong to this person to manage or fix, no matter how much they've been conditioned to believe otherwise.

Important rules:
- Never describe, judge, or characterize another person in any way — not negatively, not positively. Other people are not the subject here. This person is.
- No blame in either direction. Not "their guilt-tripping" or "his anger" — just "someone else's disappointment" or "another person's reaction."
- What's theirs is not a criticism — it's an invitation to have agency. Frame it that way.
- What's not theirs is not permission to dismiss others — it's permission to stop carrying what was never theirs to carry.
- No therapy-speak. No "boundaries," "toxic," "trauma response," "self-care." Just plain, honest language.

Return ONLY valid JSON with this exact structure and nothing else:
{
  "whatsYours": ["phrase 1", "phrase 2", "phrase 3"],
  "whatsNotYours": ["phrase 1", "phrase 2", "phrase 3"],
  "affirmation": "one short closing line"
}

Each item is a short phrase, not a sentence. Max 4 items per category.
The affirmation should be a quiet, grounded line — not a cheer, not a pep talk. Something like "You can only work with what's actually yours." Keep it plain and real.`;

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
      if (import.meta.env.VITE_MOCK_AI === 'true') {
        await new Promise((r) => setTimeout(r, 500));
        if (!cancelled) {
          const mock: InsightData = {
            whatsYours: ['[MOCK] item one', '[MOCK] item two'],
            whatsNotYours: ['[MOCK] item one', '[MOCK] item two'],
            affirmation: '[MOCK] AI skipped — VITE_MOCK_AI=true',
          };
          setInsight(mock);
          onSaveInsight?.(mock);
        }
        return;
      }

      const response = await aiMessage({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserMessage(intakeTranscript, askTranscript, emotions, sensations),
          },
        ],
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mauve-light border border-mauve-dark text-[9px] font-body font-semibold text-warm-dark uppercase tracking-widest mb-3">✦ AI</span>
        <motion.h2 className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center mb-2">
          Let's separate what's yours from what isn't.
        </motion.h2>
        <p className="font-body text-sm text-warm-dark-light text-center mb-10">
          Your feelings are yours. Other people's reactions aren't.
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
        <p className="font-body text-sm text-warm-dark-light text-center mb-8 max-w-xs">{error}</p>
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

      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mauve-light border border-mauve-dark text-[9px] font-body font-semibold text-warm-dark uppercase tracking-widest mb-3">✦ AI</span>
      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center mb-2">
        Let's separate what's yours from what isn't.
      </h2>
      <p className="font-body text-sm text-warm-dark-light text-center mb-8">
        Your feelings are yours. Other people's reactions aren't.
      </p>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border-2 border-tomato bg-cream p-5">
          <h3 className="font-heading font-bold text-base text-tomato mb-3">What's yours to be accountable for</h3>
          <ul className="space-y-2.5">
            {(insight!.whatsYours ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tomato flex-shrink-0" />
                <span className="font-body text-sm text-warm-dark-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border-2 border-orange-dark bg-cream p-5">
          <h3 className="font-heading font-bold text-base text-orange-dark mb-3">What's not yours to be accountable for</h3>
          <ul className="space-y-2.5">
            {(insight!.whatsNotYours ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-dark flex-shrink-0" />
                <span className="font-body text-sm text-warm-dark-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="px-8 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve font-heading font-semibold text-base text-warm-dark shadow-chunky cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
        continue
      </button>
    </motion.div>
  );
}
