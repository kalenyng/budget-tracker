import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Download, LogOut, Moon, Sun } from 'lucide-react';
import { getAllMonthlyData, saveAllMonthlyData } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export function SettingsDrawer({ isOpen, onClose, onReset }: SettingsDrawerProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { signOut, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleReset = () => {
    if (showResetConfirm && user) {
      // Clear all data from localStorage for this user
      saveAllMonthlyData(user.id, {});
      onReset();
      setShowResetConfirm(false);
      onClose();
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleExport = () => {
    if (!user) return;
    const data = getAllMonthlyData(user.id);
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-800 z-50 shadow-2xl safe-area-bottom"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Email */}
                {user && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                  </div>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 flex items-center gap-3 hover:shadow-xl transition-shadow"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>

                {/* Export Data */}
                <button
                  onClick={handleExport}
                  className="w-full glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 flex items-center gap-3 hover:shadow-xl transition-shadow"
                >
                  <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Export Data</span>
                </button>

                {/* Reset Data */}
                <button
                  onClick={handleReset}
                  className="w-full glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-red-200 dark:border-red-800 flex items-center gap-3 hover:shadow-xl transition-shadow"
                >
                  <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {showResetConfirm ? 'Confirm Reset' : 'Reset All Data'}
                  </span>
                </button>

                {showResetConfirm && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
                    This will permanently delete all your data. This action cannot be undone.
                  </div>
                )}

                {/* Sign Out */}
                <button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="w-full glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-200 dark:border-gray-700 flex items-center gap-3 hover:shadow-xl transition-shadow mt-6"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
