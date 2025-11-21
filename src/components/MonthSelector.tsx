import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthKey } from '@/utils/calculations';

interface MonthSelectorProps {
  currentMonthKey: string;
  availableMonths: string[];
  onMonthChange: (monthKey: string) => void;
}

export function MonthSelector({ currentMonthKey, availableMonths, onMonthChange }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentIndex = availableMonths.indexOf(currentMonthKey);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  const goToPrevious = () => {
    if (hasPrevious) {
      const nextIndex = currentIndex + 1;
      onMonthChange(availableMonths[nextIndex]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      const nextIndex = currentIndex - 1;
      onMonthChange(availableMonths[nextIndex]);
    }
  };

  const handleMonthSelect = (monthKey: string) => {
    onMonthChange(monthKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between glass rounded-2xl p-3 shadow-lg shadow-black/5 border border-gray-100">
        <button
          onClick={goToPrevious}
          disabled={!hasPrevious}
          className={`p-2 rounded-lg transition-colors ${
            hasPrevious
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 mx-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">
            {formatMonthKey(currentMonthKey)}
          </span>
        </button>

        <button
          onClick={goToNext}
          disabled={!hasNext}
          className={`p-2 rounded-lg transition-colors ${
            hasNext
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl shadow-lg shadow-black/10 border border-gray-100 z-50 max-h-64 overflow-y-auto"
            >
              {availableMonths.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No months available
                </div>
              ) : (
                <div className="p-2">
                  {availableMonths.map((monthKey) => (
                    <button
                      key={monthKey}
                      onClick={() => handleMonthSelect(monthKey)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        monthKey === currentMonthKey
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {formatMonthKey(monthKey)}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

