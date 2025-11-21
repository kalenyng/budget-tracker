import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, History, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/budgets', icon: Calendar, label: 'Budgets' },
  { path: '/history', icon: History, label: 'History' },
];

interface BottomNavBarProps {
  onOpenSettings: () => void;
}

export function BottomNavBar({ onOpenSettings }: BottomNavBarProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-lg shadow-black/5">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-gray-400'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative z-10"
              >
                <Icon size={24} />
              </motion.div>
              <span className={cn(
                'relative z-10 text-xs mt-1',
                isActive ? 'font-semibold' : 'font-normal'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onOpenSettings}
          className={cn(
            'relative flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-400'
          )}
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="relative z-10"
          >
            <Settings size={24} />
          </motion.div>
          <span className="relative z-10 text-xs mt-1 font-normal">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}

