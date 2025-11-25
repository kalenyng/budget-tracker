import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Transaction } from '@/types';
import { validateExpenseInput } from '@/utils/budgetCalculations';
import { useBudget } from '@/contexts/BudgetContext';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  transaction?: Transaction | null;
}

export function AddExpenseSheet({ isOpen, onClose, onSave, transaction }: AddExpenseSheetProps) {
  const { monthData } = useBudget();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const isSubmittingRef = React.useRef(false);

  // Get all existing categories from budgets and transactions
  // This ensures categories created on the Budgets page are immediately available
  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    if (monthData) {
      // Get categories from budgets (categories with budget amounts)
      Object.keys(monthData.budgets).forEach((cat) => categories.add(cat));
      // Also include categories from transactions (in case a category was used but has no budget)
      monthData.transactions.forEach((t) => categories.add(t.category));
    }
    return Array.from(categories).sort();
  }, [monthData]);

  // Update form when transaction prop changes (for editing)
  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setIsNewCategory(!existingCategories.includes(transaction.category));
      setNewCategoryName(existingCategories.includes(transaction.category) ? '' : transaction.category);
      setNote(transaction.note || '');
      setDate(transaction.date.split('T')[0]);
    } else {
      setAmount('');
      setCategory(existingCategories.length > 0 ? existingCategories[0] : '');
      setIsNewCategory(false);
      setNewCategoryName('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [transaction, isOpen, existingCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setError('');

    const validation = validateExpenseInput(amount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      isSubmittingRef.current = false;
      return;
    }

    const finalCategory = isNewCategory ? newCategoryName.trim() : category;
    if (!finalCategory) {
      setError('Please select or enter a category');
      isSubmittingRef.current = false;
      return;
    }

    onSave({
      date: new Date(date).toISOString(),
      amount: validation.value,
      category: finalCategory,
      note: note.trim() || undefined,
    });

    // Reset form
    setAmount('');
    setNote('');
    setCategory(existingCategories.length > 0 ? existingCategories[0] : '');
    setIsNewCategory(false);
    setNewCategoryName('');
    setDate(new Date().toISOString().split('T')[0]);
    
    // Close immediately
    onClose();
    
    // Reset flag after a delay to allow modal to fully close
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmittingRef.current) {
      onClose();
    }
  };

  // Reset submitting flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto pb-20 safe-area-bottom"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transaction ? 'Edit Expense' : 'Add Expense'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategory(false);
                          setNewCategoryName('');
                          if (existingCategories.length > 0) {
                            setCategory(existingCategories[0]);
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          !isNewCategory
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategory(true);
                          setCategory('');
                          setNewCategoryName('');
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          isNewCategory
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        New Category
                      </button>
                    </div>
                    {!isNewCategory ? (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      >
                        {existingCategories.length === 0 ? (
                          <option value="">No categories yet - create one first</option>
                        ) : (
                          existingCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What did you spend on?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-98"
                >
                  {transaction ? 'Update Expense' : 'Add Expense'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
