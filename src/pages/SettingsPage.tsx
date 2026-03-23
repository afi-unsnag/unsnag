import React, { useState } from 'react';
import { motion } from 'framer-motion';
export function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  return (
    <div className="min-h-screen bg-cream px-5 pt-6 pb-24">
      <div className="max-w-md mx-auto">
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
              <SettingsRow label="Username" value="@yourusername" />
              <SettingsRow label="Email" value="you@email.com" />
            </div>
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
            <button
              className="
                px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-cream-dark
                font-heading font-semibold text-sm text-warm-dark
                shadow-chunky-sm cursor-pointer
                active:translate-y-[2px] active:shadow-chunky-pressed transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              ">






              
              Change password
            </button>
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
                <p className="font-body text-sm text-warm-dark font-medium">
                  Free plan
                </p>
                <p className="font-body text-xs text-warm-gray">
                  Unlimited unsnags
                </p>
              </div>
              <button
                className="
                  px-5 py-2.5 rounded-lg border-2 border-warm-dark bg-mauve
                  font-heading font-semibold text-sm text-warm-dark
                  shadow-chunky-sm cursor-pointer
                  active:translate-y-[2px] active:shadow-chunky-pressed transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                ">






                
                Manage
              </button>
            </div>
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
            <p className="font-body text-xs text-warm-gray mb-4">
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
                className="font-body text-sm text-warm-gray underline cursor-pointer hover:text-warm-dark transition-colors">
                
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
      <span className="font-body text-sm text-warm-gray">{label}</span>
      <span className="font-body text-sm text-warm-dark font-medium">
        {value}
      </span>
    </div>);

}