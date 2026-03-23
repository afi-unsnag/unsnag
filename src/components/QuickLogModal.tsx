import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XIcon } from 'lucide-react';
interface QuickLogModalProps {
  onSave: (note: string) => void;
}
export function QuickLogModal({ onSave }: QuickLogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const handleSave = useCallback(() => {
    if (note.trim()) {
      onSave(note.trim());
      setNote('');
      setIsOpen(false);
    }
  }, [note, onSave]);
  return (
    <>
      {/* Floating action button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-24 right-5 z-40
          w-14 h-14 rounded-full border-[3px] border-warm-dark bg-mauve
          flex items-center justify-center
          shadow-chunky cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        "






        whileHover={{
          scale: 1.06
        }}
        whileTap={{
          scale: 0.92,
          y: 2,
          boxShadow: '1px 1px 0px 0px #2D2A26'
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 15
        }}
        aria-label="Quick log — save something for later">
        
        <PlusIcon className="w-6 h-6 text-warm-dark" strokeWidth={3} />
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen &&
        <>
            {/* Backdrop */}
            <motion.div
            className="fixed inset-0 z-50 bg-warm-dark/40"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setIsOpen(false)} />
          

            {/* Modal sheet */}
            <motion.div
            className="
                fixed bottom-0 left-0 right-0 z-50
                bg-cream border-t-[3px] border-l-[3px] border-r-[3px] border-warm-dark
                rounded-t-2xl p-6 pb-24
                max-w-lg mx-auto
              "





            initial={{
              y: '100%'
            }}
            animate={{
              y: 0
            }}
            exit={{
              y: '100%'
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30
            }}>
            
              {/* Close button */}
              <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-warm-gray hover:text-warm-dark transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve rounded"
              aria-label="Close">
              
                <XIcon className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <h3 className="font-heading text-xl font-bold text-warm-dark mb-1">
                Save something for later
              </h3>
              <p className="font-body text-sm text-warm-gray mb-5">
                Had a moment? Don't have time to process it? Drop it here.
              </p>

              <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="what happened…"
              className="
                  w-full p-3.5 rounded-lg border-2 border-warm-gray-light bg-cream-dark
                  font-body text-sm text-warm-dark placeholder:text-warm-gray
                  resize-none focus:border-warm-dark transition-colors
                "




              rows={4}
              aria-label="Quick note" />
            

              <div className="flex justify-end mt-4">
                <motion.button
                onClick={handleSave}
                className={`
                    px-6 py-2.5 rounded-lg border-2 font-heading font-semibold text-sm cursor-pointer
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                    ${note.trim() ? 'border-warm-dark bg-mauve text-warm-dark shadow-chunky-sm' : 'border-warm-gray-light bg-cream-dark text-warm-gray cursor-not-allowed'}
                  `}
                whileTap={
                note.trim() ?
                {
                  scale: 0.96,
                  y: 2,
                  boxShadow: '1px 1px 0px 0px #2D2A26'
                } :
                {}
                }
                disabled={!note.trim()}>
                
                  save
                </motion.button>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}