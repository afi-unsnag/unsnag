import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AccessStatus } from '../lib/subscription';

interface SettingsPageProps {
  user: User;
  accessStatus: AccessStatus;
  onBack: () => void;
}

export function SettingsPage({ user, accessStatus, onBack }: SettingsPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  useEffect(() => {
    if (accessStatus !== 'trial') return;
    supabase
      .from('profiles')
      .select('trial_started_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data?.trial_started_at) return;
        const trialEnd = new Date(data.trial_started_at);
        trialEnd.setDate(trialEnd.getDate() + 14);
        const msLeft = trialEnd.getTime() - Date.now();
        setTrialDaysLeft(Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24))));
      });
  }, [accessStatus, user.id]);

  const handleChangePassword = async () => {
    if (!user.email) return;
    setPasswordResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
    setPasswordResetLoading(false);
    setPasswordResetSent(true);
  };

  const handleManage = async () => {
    setManagingBilling(true);
    setBillingError(null);
    try {
      const fnName = accessStatus === 'subscribed'
        ? 'create-portal-session'
        : 'create-checkout-session';

      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { origin: window.location.origin },
      });

      if (error) {
        const raw = await (error as any).context?.text?.().catch(() => null);
        setBillingError(raw ?? error.message);
        return;
      }

      if (!data?.url) {
        setBillingError(`No redirect URL returned: ${JSON.stringify(data)}`);
        return;
      }

      window.location.href = data.url;
    } catch {
      setBillingError('Network error. Please try again.');
    } finally {
      setManagingBilling(false);
    }
  };

  const planLabel = accessStatus === 'subscribed'
    ? 'Paid plan'
    : accessStatus === 'trial'
    ? 'Free trial'
    : 'Trial expired';

  const planSub = accessStatus === 'subscribed'
    ? '$5 / month · cancel anytime'
    : accessStatus === 'trial'
    ? trialDaysLeft === null
      ? 'Free trial'
      : trialDaysLeft === 1
      ? '1 day left in trial'
      : `${trialDaysLeft} days left in trial`
    : 'Subscribe to keep access';

  const manageLabel = managingBilling
    ? 'Loading…'
    : accessStatus === 'subscribed'
    ? 'Manage'
    : 'Subscribe';
  return (
    <div className="min-h-screen bg-cream px-5 pt-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark flex items-center justify-center cursor-pointer hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            whileTap={{ scale: 0.92, y: 1 }}
            aria-label="Go home">
            <ArrowLeftIcon className="w-4 h-4 text-warm-dark-light" strokeWidth={2.5} />
          </motion.button>
        </div>
        <motion.h1
          className="font-heading text-3xl font-bold text-warm-dark mb-8"
          initial={{
            opacity: 0,
            y: 12
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 22
          }}>
          
          Settings
        </motion.h1>

        <div className="space-y-5">
          {/* Account */}
          <motion.section
            className="rounded-xl border-2 border-warm-dark bg-cream p-5 shadow-chunky-sm"
            initial={{
              opacity: 0,
              y: 16
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.05,
              type: 'spring',
              stiffness: 300,
              damping: 22
            }}>
            
            <h2 className="font-heading text-base font-bold text-warm-dark mb-4">
              Account
            </h2>
            <div className="space-y-3">
              <SettingsRow label="Email" value={user.email ?? '—'} />
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="mt-4 px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-cream-dark font-heading font-semibold text-sm text-warm-dark-light shadow-chunky-sm cursor-pointer active:translate-y-[2px] active:shadow-chunky-pressed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
              Sign out
            </button>
          </motion.section>

          {/* Security */}
          <motion.section
            className="rounded-xl border-2 border-warm-dark bg-cream p-5 shadow-chunky-sm"
            initial={{
              opacity: 0,
              y: 16
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 22
            }}>
            
            <h2 className="font-heading text-base font-bold text-warm-dark mb-4">
              Security
            </h2>
            {passwordResetSent ? (
              <p className="font-body text-sm text-warm-dark-light">
                Check your email for a reset link. ✓
              </p>
            ) : (
              <button
                onClick={handleChangePassword}
                disabled={passwordResetLoading}
                className={`
                  px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-cream-dark
                  font-heading font-semibold text-sm text-warm-dark-light
                  shadow-chunky-sm cursor-pointer
                  active:translate-y-[2px] active:shadow-chunky-pressed transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                  ${passwordResetLoading ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >


                {passwordResetLoading ? 'Sending…' : 'Change password'}
              </button>
            )}
          </motion.section>

          {/* Subscription */}
          <motion.section
            className="rounded-xl border-2 border-warm-dark bg-cream p-5 shadow-chunky-sm"
            initial={{
              opacity: 0,
              y: 16
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.15,
              type: 'spring',
              stiffness: 300,
              damping: 22
            }}>
            
            <h2 className="font-heading text-base font-bold text-warm-dark mb-4">
              Subscription
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-warm-dark-light font-medium">
                  {planLabel}
                </p>
                <p className="font-body text-xs text-warm-dark-light">
                  {planSub}
                </p>
              </div>
              <button
                onClick={handleManage}
                disabled={managingBilling}
                className={`
                  px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-mauve
                  font-heading font-semibold text-sm text-warm-dark-light
                  shadow-chunky-sm cursor-pointer
                  active:translate-y-[2px] active:shadow-chunky-pressed transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                  ${managingBilling ? 'opacity-60 cursor-not-allowed' : ''}
                `}>
                {manageLabel}
              </button>
            </div>
            {billingError && (
              <p className="mt-3 font-body text-xs text-tomato">{billingError}</p>
            )}
          </motion.section>

          {/* Danger zone */}
          <motion.section
            className="rounded-xl border-2 border-tomato/50 bg-cream p-5"
            initial={{
              opacity: 0,
              y: 16
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 300,
              damping: 22
            }}>
            
            <h2 className="font-heading text-base font-bold text-tomato mb-2">
              Danger zone
            </h2>
            <p className="font-body text-xs text-warm-dark-light mb-4">
              This permanently deletes your account and all your data.
            </p>

            {!showDeleteConfirm ?
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="
                  px-5 py-2.5 rounded-lg border-2 border-tomato bg-cream
                  font-heading font-semibold text-sm text-tomato
                  cursor-pointer hover:bg-tomato hover:text-cream transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                ">





              
                Delete account
              </button> :

            <motion.div
              className="flex items-center gap-3"
              initial={{
                opacity: 0,
                x: -8
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20
              }}>
              
                <button
                className="
                    px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-tomato
                    font-heading font-semibold text-sm text-cream
                    shadow-chunky-sm cursor-pointer
                    active:translate-y-[2px] active:shadow-chunky-pressed transition-all
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark
                  ">






                
                  Yes, delete everything
                </button>
                <button
                onClick={() => setShowDeleteConfirm(false)}
                className="font-body text-sm text-warm-dark-light underline cursor-pointer hover:text-warm-dark transition-colors">
                
                  cancel
                </button>
              </motion.div>
            }
          </motion.section>
        </div>
      </div>
    </div>);

}
function SettingsRow({ label, value }: {label: string;value: string;}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-sm text-warm-dark-light">{label}</span>
      <span className="font-body text-sm text-warm-dark-light font-medium">
        {value}
      </span>
    </div>);

}