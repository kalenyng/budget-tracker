import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBudget } from '@/contexts/BudgetContext';
import { MonthSelector } from '@/components/MonthSelector';
import { formatZAR } from '@/utils/budgetCalculations';
import { getTotalBudget } from '@/utils/calculations';
import { getCurrentMonthKey } from '@/utils/storage';
import { Plus, X } from 'lucide-react';

export function Budgets() {
  const {
    currentMonthKey,
    monthData,
    loading,
    switchMonth,
    updateBudget,
    updateBudgets,
    getAllMonthKeys,
    copyBudgets,
    reload,
  } = useBudget();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Update available months when data changes
  useEffect(() => {
    const months = getAllMonthKeys();
    const currentKey = getCurrentMonthKey();
    if (!months.includes(currentKey)) {
      months.unshift(currentKey);
    }
    setAvailableMonths(months);
  }, [getAllMonthKeys, monthData, currentMonthKey]);

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
          <p className="text-gray-400 dark:text-gray-500 mb-4">No budget data found</p>
        </div>
      </div>
    );
  }

  const handleSaveBudget = (category: string, amount: number) => {
    updateBudget(category, amount);
    setEditingCategory(null);
    setEditingAmount('');
    reload();
  };

  const handleAddCategory = () => {
    const amount = parseFloat(newAmount);
    const categoryName = newCategoryName.trim();
    
    if (!isNaN(amount) && amount > 0 && categoryName.length > 0) {
      // Check if category already exists
      if (monthData?.budgets[categoryName]) {
        return;
      }
      
      updateBudget(categoryName, amount);
      setShowAddCategory(false);
      setNewCategoryName('');
      setNewAmount('');
      // reload() is already called in updateBudget, but we call it again to ensure immediate update
      reload();
    }
  };

  const handleDeleteBudget = (category: string) => {
    const updatedBudgets = { ...monthData.budgets };
    delete updatedBudgets[category];
    updateBudgets(updatedBudgets);
    reload();
  };

  const handleCopyFromPrevious = () => {
    const months = getAllMonthKeys();
    const currentIndex = months.indexOf(currentMonthKey);
    if (currentIndex < months.length - 1) {
      const previousMonth = months[currentIndex + 1];
      copyBudgets(previousMonth, currentMonthKey);
    }
  };

  const budgetEntries = Object.entries(monthData.budgets || {});
  const totalBudget = getTotalBudget(monthData);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Monthly Budgets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set your budget for each category</p>
        </div>

        {/* Month Selector */}
        <MonthSelector
          currentMonthKey={currentMonthKey}
          availableMonths={availableMonths}
          onMonthChange={switchMonth}
        />

        {/* Copy from Previous Month */}
        {availableMonths.length > 1 && availableMonths.indexOf(currentMonthKey) < availableMonths.length - 1 && (
          <button
            onClick={handleCopyFromPrevious}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Copy budgets from previous month
          </button>
        )}

        {/* Total Budget Summary */}
        <div className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-semibold">Total Monthly Budget</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatZAR(totalBudget)}</span>
          </div>
        </div>

        {/* Budget List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
            {!showAddCategory && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex items-center gap-2 text-primary font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Add Category Form */}
            {showAddCategory && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Groceries, Rent, Entertainment"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoFocus
                    />
                    {newCategoryName.trim() && monthData?.budgets[newCategoryName.trim()] && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        This category already exists
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Amount (ZAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                        setNewAmount('');
                      }}
                      className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim() || !newAmount || parseFloat(newAmount) <= 0 || (monthData?.budgets[newCategoryName.trim()] !== undefined)}
                      className="flex-1 py-2 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Budget Items */}
            {budgetEntries.length === 0 ? (
              <div className="glass rounded-2xl p-8 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-400 dark:text-gray-500 mb-2">No budgets set yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click "Add" to set up your first budget category
                </p>
              </div>
            ) : (
              budgetEntries.map(([category, amount]) => {
                const isEditing = editingCategory === category;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category}</h3>
                          <button
                            onClick={() => {
                              setEditingCategory(null);
                              setEditingAmount('');
                            }}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Budget Amount (ZAR)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteBudget(category)}
                            className="flex-1 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const amount = parseFloat(editingAmount);
                              if (!isNaN(amount) && amount >= 0) {
                                handleSaveBudget(category, amount);
                              }
                            }}
                            className="flex-1 py-2 bg-primary text-white rounded-xl font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly budget</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatZAR(amount)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setEditingAmount(amount.toString());
                            }}
                            className="px-4 py-2 text-primary font-medium hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

