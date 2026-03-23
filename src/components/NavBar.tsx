import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, ClockIcon, SettingsIcon, BookmarkIcon } from 'lucide-react';
type NavTab = 'home' | 'history' | 'saved' | 'settings';
interface NavBarProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}
export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-cream border-t-2 border-warm-dark"
      aria-label="Main navigation">
      
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        <NavItem
          icon={<HomeIcon className="w-5 h-5" strokeWidth={2.5} />}
          label="Home"
          isActive={active === 'home'}
          onClick={() => onNavigate('home')} />
        
        <NavItem
          icon={<ClockIcon className="w-5 h-5" strokeWidth={2.5} />}
          label="History"
          isActive={active === 'history'}
          onClick={() => onNavigate('history')} />
        
        <NavItem
          icon={<BookmarkIcon className="w-5 h-5" strokeWidth={2.5} />}
          label="Saved"
          isActive={active === 'saved'}
          onClick={() => onNavigate('saved')} />
        
        <NavItem
          icon={<SettingsIcon className="w-5 h-5" strokeWidth={2.5} />}
          label="Settings"
          isActive={active === 'settings'}
          onClick={() => onNavigate('settings')} />
        
      </div>
    </nav>);

}
function NavItem({
  icon,
  label,
  isActive,
  onClick





}: {icon: React.ReactNode;label: string;isActive: boolean;onClick: () => void;}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-0.5 px-4 py-1 cursor-pointer
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-lg
        ${isActive ? 'text-mauve-dark' : 'text-warm-gray'}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}>
      
      <motion.div
        animate={{
          y: isActive ? -2 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 20
        }}>
        
        {icon}
      </motion.div>
      <span
        className={`text-[10px] font-body font-medium ${isActive ? 'font-semibold' : ''}`}>
        
        {label}
      </span>
      {isActive &&
      <motion.div
        className="w-1 h-1 rounded-full bg-mauve-dark"
        layoutId="nav-indicator"
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }} />

      }
    </button>);

}