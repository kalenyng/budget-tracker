import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useBudget } from '@/contexts/BudgetContext';
import { CategoryCard } from '@/components/CategoryCard';
import { MonthSelector } from '@/components/MonthSelector';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { CsvImportSheet } from '@/components/CsvImportSheet';
import { IncomeEditor } from '@/components/IncomeEditor';
import { ChartSwitcher } from '@/components/ChartSwitcher';
import { Transaction } from '@/types';
import { getCategoryBudgetInfo, getTotalSpent, getTotalBudget } from '@/utils/calculations';
import { formatZAR } from '@/utils/budgetCalculations';
import { getCurrentMonthKey } from '@/utils/storage';

export function Dashboard() {
  const {
    currentMonthKey,
    monthData,
    loading,
    switchMonth,
    updateIncome,
    addTransaction,
    updateTransaction,
    getAllMonthKeys,
    reload,
  } = useBudget();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const months = getAllMonthKeys();
    const currentKey = getCurrentMonthKey();
    
    // Ensure current month is in the list
    if (!months.includes(currentKey)) {
      months.unshift(currentKey);
    }
    
    setAvailableMonths(months);
  }, [getAllMonthKeys, monthData, currentMonthKey]);

  const handleSave = async (transaction: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transaction);
    } else {
      addTransaction(transaction);
    }
    setIsSheetOpen(false);
    setEditingTransaction(null);
    reload();
  };

  const handleClose = () => {
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsSheetOpen(true);
  };

  const handleCsvImport = (transactions: Omit<Transaction, 'id'>[]) => {
    transactions.forEach((transaction) => {
      addTransaction(transaction);
    });
    reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!monthData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400 dark:text-gray-500 mb-4">Loading budget data...</p>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryBudgetInfo(monthData)
    .sort((a, b) => a.percentage - b.percentage); // Sort by % used: least used at top, most used at bottom
  const totalBudget = getTotalBudget(monthData);
  const totalSpent = getTotalSpent(monthData);
  const totalRemaining = totalBudget - totalSpent;
  const income = monthData.income ?? 0;
  const incomeRemaining = income - totalSpent;

  // Get recent transactions (last 5)
  const recentTransactions = [...monthData.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Overview</h1>
          <button
            onClick={() => setIsCsvImportOpen(true)}
            disabled
            className="hidden px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors text-sm opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Import CSV
          </button>
        </div>

        {/* Month Selector */}
        <MonthSelector
          currentMonthKey={currentMonthKey}
          availableMonths={availableMonths}
          onMonthChange={switchMonth}
        />

        {/* Income Editor */}
        <IncomeEditor
          income={monthData.income ?? 0}
          onSave={updateIncome}
        />

        {/* Summary Card */}
        <div className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
          <div className="space-y-4">
            {income > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Income</span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatZAR(income)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatZAR(totalBudget)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatZAR(totalSpent)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">
                {income > 0 ? 'Remaining from Income' : 'Remaining Budget'}
              </span>
              <span
                className={`text-2xl font-bold ${
                  (income > 0 ? incomeRemaining : totalRemaining) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatZAR(income > 0 ? incomeRemaining : totalRemaining)}
              </span>
            </div>
            
            {/* Chart Switcher */}
            {categoryInfo.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Spending Overview</h3>
                <ChartSwitcher categoryData={categoryInfo} monthData={monthData} />
              </div>
            )}
          </div>
        </div>

        {/* Category Cards */}
        {categoryInfo.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h2>
            <div className="space-y-3">
              {categoryInfo.map((info) => (
                <CategoryCard key={info.category} info={info} />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-2">No budgets set yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Go to the Budgets page to set up your monthly budgets
            </p>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Expenses</h2>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleEdit(transaction)}
                  className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {transaction.note || transaction.category}
                      </p>
                      {transaction.note && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.category}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatZAR(transaction.amount)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FloatingAddButton onClick={handleAdd} />
      <AddExpenseSheet
        isOpen={isSheetOpen}
        onClose={handleClose}
        onSave={handleSave}
        transaction={editingTransaction}
      />
      <CsvImportSheet
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImport={handleCsvImport}
      />
    </motion.div>
  );
}
