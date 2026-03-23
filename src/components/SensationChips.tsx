import React from 'react';
import { motion } from 'framer-motion';
interface SensationChipsProps {
  selected: string[];
  onToggle: (sensation: string) => void;
}
const SENSATIONS = [
'lump in throat',
'tight chest',
'heavy arms',
'jittery',
'stomach knot',
'clenched jaw',
'shallow breathing',
'numb',
'racing heart',
'tingling',
'headache',
'shaky hands',
'hot face',
'cold hands',
'tight shoulders',
'pit in stomach',
'dizzy',
'heavy legs',
'dry mouth',
'sweaty palms',
'pressure in head',
'tight back',
"can't sit still",
'exhausted',
'floaty',
'buzzing skin',
'heavy eyelids',
'sore throat',
'wobbly knees',
'chest flutter'];

export function SensationChips({ selected, onToggle }: SensationChipsProps) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="group"
      aria-label="Select physical sensations">
      
      {SENSATIONS.map((sensation, i) => {
        const isSelected = selected.includes(sensation);
        return (
          <motion.button
            key={sensation}
            onClick={() => onToggle(sensation)}
            className={`
              px-3.5 py-1.5 rounded-lg border-2 font-body text-sm font-medium cursor-pointer
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              ${isSelected ? 'border-warm-dark bg-blush text-warm-dark shadow-chunky-sm' : 'border-warm-gray-light bg-cream-dark text-warm-dark-light'}
            `}
            initial={{
              opacity: 0,
              y: 8
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: i * 0.02,
              type: 'spring',
              stiffness: 400,
              damping: 22
            }}
            whileTap={{
              scale: 0.94
            }}
            aria-pressed={isSelected}
            role="button">
            
            {sensation}
          </motion.button>);

      })}
    </div>);

}