import React from 'react';
import { motion } from 'framer-motion';
interface EmotionChipsProps {
  selected: string[];
  onToggle: (emotion: string) => void;
}
const EMOTIONS = [
'anxious',
'guilty',
'overwhelmed',
'frustrated',
'sad',
'angry',
'numb',
'confused',
'ashamed',
'scared',
'lonely',
'jealous',
'insecure',
'resentful',
'panicked',
'disappointed',
'helpless',
'rejected',
'stuck',
'drained',
'invisible'];

export function EmotionChips({ selected, onToggle }: EmotionChipsProps) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="group"
      aria-label="Select emotions you're feeling">
      
      {EMOTIONS.map((emotion, i) => {
        const isSelected = selected.includes(emotion);
        return (
          <motion.button
            key={emotion}
            onClick={() => onToggle(emotion)}
            className={`
              px-3.5 py-1.5 rounded-lg border-2 font-body text-sm font-medium cursor-pointer
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              ${isSelected ? 'border-warm-dark bg-tomato text-cream shadow-chunky-sm' : 'border-warm-gray-light bg-cream-dark text-warm-dark-light'}
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
            
            {emotion}
          </motion.button>);

      })}
    </div>);

}