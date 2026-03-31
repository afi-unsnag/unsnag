import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface PaywallScreenProps {
  user: User;
  onAccessGranted: () => void;
}

export function PaywallScreen({ user, onAccessGranted }: PaywallScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ origin: window.location.origin }),
        }
      );

      if (!res.ok) throw new Error('Could not start checkout.');

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Icon */}
      <motion.div
        className="w-20 h-20 rounded-full bg-mauve border-[3px] border-warm-dark shadow-chunky flex items-center justify-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.1 }}
      >
        <span className="text-3xl">🔒</span>
      </motion.div>

      <motion.h1
        className="font-heading text-3xl sm:text-4xl font-bold text-warm-dark mb-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 22 }}
      >
        Your free trial has ended.
      </motion.h1>

      <motion.p
        className="font-body text-base text-warm-dark-light max-w-xs leading-relaxed mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        If Unsnag has helped, keep going for $5/month.
      </motion.p>

      {/* Pricing card */}
      <motion.div
        className="w-full max-w-xs rounded-xl border-[3px] border-warm-dark bg-cream-dark shadow-chunky p-6 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
      >
        <p className="font-heading text-4xl font-bold text-warm-dark mb-0.5">$5</p>
        <p className="font-body text-sm text-warm-dark-light mb-4">per month · cancel anytime</p>
        <div className="space-y-2 text-left">
          {['Unlimited sessions', 'AI-powered insight', 'Full session history'].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-mauve-dark flex-shrink-0" />
              <span className="font-body text-sm text-warm-dark-light">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {error && (
        <p className="font-body text-sm text-tomato mb-4 max-w-xs">{error}</p>
      )}

      <motion.button
        onClick={handleSubscribe}
        disabled={loading}
        className={`
          w-full max-w-xs py-4 rounded-xl border-[3px] border-warm-dark
          font-heading font-semibold text-lg text-warm-dark-light
          focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          ${loading ? 'bg-cream-dark cursor-not-allowed opacity-60' : 'bg-mauve shadow-chunky cursor-pointer'}
        `}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 18 }}
        whileHover={loading ? undefined : { scale: 1.02 }}
        whileTap={loading ? undefined : { scale: 0.97, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' }}
      >
        {loading ? 'Redirecting to Stripe…' : 'Subscribe — $5/month'}
      </motion.button>

      <motion.button
        onClick={handleSignOut}
        className="mt-5 font-body text-xs text-warm-dark-light underline underline-offset-2 decoration-warm-gray-light cursor-pointer hover:text-warm-dark transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        sign out
      </motion.button>
    </motion.div>
  );
}
