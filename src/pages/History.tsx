import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBudget } from '@/contexts/BudgetContext';
import { formatZAR } from '@/utils/budgetCalculations';
import { formatMonthKey, getTotalSpent, getTotalBudget } from '@/utils/calculations';
import { ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function History() {
  const { getAllMonthKeys, getMonthData, switchMonth } = useBudget();
  const [monthKeys, setMonthKeys] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const months = getAllMonthKeys();
    setMonthKeys(months);
  }, [getAllMonthKeys]);

  const handleMonthClick = (monthKey: string) => {
    switchMonth(monthKey);
    navigate('/');
  };

  if (monthKeys.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 pb-24"
      >
        <div className="p-4 space-y-4">
          <div className="pt-4">
            <h1 className="text-3xl font-bold text-gray-900">History</h1>
            <p className="text-gray-500 mt-1">View past months</p>
          </div>

          <div className="glass rounded-2xl p-8 shadow-lg shadow-black/5 border border-gray-100 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No history available</p>
            <p className="text-sm text-gray-500 mt-2">
              Start adding expenses to see your monthly history
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="text-gray-500 mt-1">View past months</p>
        </div>

        <div className="space-y-4">
          {monthKeys.map((monthKey) => {
            const monthData = getMonthData(monthKey);
            if (!monthData) return null;

            const totalBudget = getTotalBudget(monthData);
            const totalSpent = getTotalSpent(monthData);
            const totalRemaining = totalBudget - totalSpent;

            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleMonthClick(monthKey)}
                className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {formatMonthKey(monthKey)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {monthData.transactions.length} {monthData.transactions.length === 1 ? 'expense' : 'expenses'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-2">
                  {monthData.income && monthData.income > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Income</span>
                      <span className="font-semibold text-gray-900">{formatZAR(monthData.income)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Budget</span>
                    <span className="font-semibold text-gray-900">{formatZAR(totalBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="font-semibold text-gray-900">
                      {formatZAR(totalSpent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600">
                      {monthData.income && monthData.income > 0 ? 'Remaining from Income' : 'Remaining'}
                    </span>
                    <span
                      className={`font-bold ${
                        (monthData.income && monthData.income > 0 
                          ? monthData.income - totalSpent 
                          : totalRemaining) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatZAR(
                        monthData.income && monthData.income > 0
                          ? monthData.income - totalSpent
                          : totalRemaining
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
