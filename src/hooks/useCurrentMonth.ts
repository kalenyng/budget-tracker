import { useState, useEffect } from 'react';
import { getCurrentMonthKey } from '@/utils/storage';

/**
 * Hook to get the current month key and detect when it changes
 */
export function useCurrentMonth() {
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getCurrentMonthKey());

  useEffect(() => {
    // Check for month changes periodically (every hour)
    const interval = setInterval(() => {
      const newMonthKey = getCurrentMonthKey();
      if (newMonthKey !== currentMonthKey) {
        setCurrentMonthKey(newMonthKey);
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [currentMonthKey]);

  return currentMonthKey;
}

