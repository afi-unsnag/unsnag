import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthScreen({ initialMode = 'signin' }: AuthScreenProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin,
    });
    setForgotLoading(false);
    setForgotSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        setSuccess('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <h1 className="font-heading text-3xl font-bold text-warm-dark mb-1">Reset password</h1>
          <p className="font-body text-sm text-warm-dark-light mb-8">
            We'll send a reset link to your email.
          </p>

          {forgotSent ? (
            <p className="font-body text-sm text-warm-dark-light">
              Check your email for a reset link. ✓
            </p>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-base text-warm-dark-light placeholder:text-warm-gray focus:border-warm-dark focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve font-heading font-semibold text-base text-warm-dark shadow-chunky cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotLoading ? '…' : 'Send reset link'}
              </button>
            </form>
          )}

          <button
            onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotSent(false); }}
            className="mt-6 w-full text-center font-body text-sm text-warm-dark-light hover:text-warm-dark transition-colors cursor-pointer"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}>

        {!success && <h1 className="font-heading text-3xl font-bold text-warm-dark mb-1">Unsnag</h1>}

        {success ? (
          <div className="flex flex-col items-center text-center mt-12 space-y-6">
            <motion.div
              className="w-16 h-16 rounded-full bg-mauve border-[3px] border-warm-dark shadow-chunky flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >
              <span className="text-2xl">✉️</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="font-heading text-2xl font-bold text-warm-dark">
                Check your email.
              </h2>
              <p className="font-body text-base text-warm-dark-light max-w-xs leading-relaxed">
                We sent a confirmation link. Click it to get access.
              </p>
            </motion.div>
          </div>
        ) : (
          <>
            <p className="font-body text-sm text-warm-dark-light mb-8">
              {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider block mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3.5 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-base text-warm-dark-light placeholder:text-warm-gray focus:border-warm-dark focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <label className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-base text-warm-dark-light placeholder:text-warm-gray focus:border-warm-dark focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3.5 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-base text-warm-dark-light placeholder:text-warm-gray focus:border-warm-dark focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {mode === 'signin' && (
                <div className="flex justify-end -mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="font-body text-xs text-warm-dark-light hover:text-warm-dark underline underline-offset-2 decoration-warm-gray-light cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <p className="font-body text-sm text-tomato">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve font-heading font-semibold text-base text-warm-dark shadow-chunky cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>

              {mode === 'signup' && (
                <p className="font-body text-xs text-warm-gray text-center mt-3 leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <a href="https://unsnag.co/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-warm-gray-light hover:text-warm-dark-light transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="https://unsnag.co/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-warm-gray-light hover:text-warm-dark-light transition-colors">
                    Privacy Policy
                  </a>.
                </p>
              )}
            </form>

            <button
              onClick={() => {
                const next = mode === 'signin' ? 'signup' : 'signin';
                setMode(next);
                setName('');
                setError(null);
                setSuccess(null);
                navigate(next === 'signin' ? '/login' : '/signup', { replace: true });
              }}
              className="mt-6 w-full text-center font-body text-sm text-warm-dark-light hover:text-warm-dark transition-colors cursor-pointer">
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
