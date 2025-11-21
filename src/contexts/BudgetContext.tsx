import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { MonthData, Transaction } from '@/types';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { useAuth } from './AuthContext';

interface BudgetContextType {
  currentMonthKey: string;
  monthData: MonthData | null;
  loading: boolean;
  switchMonth: (monthKey: string) => void;
  updateIncome: (income: number) => void;
  updateBudget: (category: string, amount: number) => void;
  updateBudgets: (budgets: { [category: string]: number }) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (transactionId: string) => void;
  getMonthData: (monthKey: string) => MonthData | null;
  getAllMonthKeys: () => string[];
  copyBudgets: (fromMonthKey: string, toMonthKey: string) => void;
  reload: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const actualCurrentMonthKey = useCurrentMonth();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => actualCurrentMonthKey);
  
  const {
    data,
    loading,
    getMonth,
    getOrCreateMonth,
    addTransaction: addTransactionToStorage,
    updateTransaction: updateTransactionInStorage,
    deleteTransaction: deleteTransactionFromStorage,
    updateBudgets: updateBudgetsInStorage,
    updateIncome: updateIncomeInStorage,
    getMonthKeys,
    copyBudgets,
    reload,
  } = useBudgetData(user?.id || '');

  // Update selected month when actual current month changes (new month detected)
  useEffect(() => {
    if (!selectedMonthKey || selectedMonthKey === actualCurrentMonthKey || (data && !data[selectedMonthKey])) {
      setSelectedMonthKey(actualCurrentMonthKey);
    }
  }, [actualCurrentMonthKey, selectedMonthKey, data]);

  // Ensure month data exists when selected month changes
  useEffect(() => {
    if (selectedMonthKey && !loading) {
      const existing = data[selectedMonthKey];
      if (!existing) {
        getOrCreateMonth(selectedMonthKey);
      }
    }
  }, [selectedMonthKey, loading, getOrCreateMonth, data]);

  // Get current month data - create default if doesn't exist
  const monthData = useMemo(() => {
    if (!selectedMonthKey) return null;
    if (loading) return null;
    const existing = data[selectedMonthKey];
    if (existing) return existing;
    // Return default structure while loading/creating
    return {
      income: 0,
      budgets: {},
      transactions: [],
    };
  }, [selectedMonthKey, data, loading]);

  // Auto-create next month if we're viewing current month and it's a new month
  useEffect(() => {
    if (selectedMonthKey === actualCurrentMonthKey && !data[actualCurrentMonthKey]) {
      // Check if there's a previous month to copy budgets from
      const allKeys = getMonthKeys();
      if (allKeys.length > 0) {
        const previousMonthKey = allKeys[0]; // Most recent month
        copyBudgets(previousMonthKey, actualCurrentMonthKey);
      }
    }
  }, [selectedMonthKey, actualCurrentMonthKey, data, getMonthKeys, copyBudgets]);

  const switchMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    // Ensure the month exists
    getOrCreateMonth(monthKey);
    reload();
  };

  const updateIncome = (income: number) => {
    updateIncomeInStorage(selectedMonthKey, income);
    reload();
  };

  const updateBudget = (category: string, amount: number) => {
    if (!monthData) return;
    const budgets = { ...monthData.budgets, [category]: amount };
    updateBudgetsInStorage(selectedMonthKey, budgets);
    reload();
  };

  const updateBudgets = (budgets: { [category: string]: number }) => {
    updateBudgetsInStorage(selectedMonthKey, budgets);
    reload();
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    addTransactionToStorage(selectedMonthKey, newTransaction);
  };

  const updateTransaction = (transactionId: string, updates: Partial<Transaction>) => {
    updateTransactionInStorage(selectedMonthKey, transactionId, updates);
  };

  const deleteTransaction = (transactionId: string) => {
    deleteTransactionFromStorage(selectedMonthKey, transactionId);
  };

  const getMonthData = (monthKey: string): MonthData | null => {
    return getMonth(monthKey);
  };

  const getAllMonthKeys = (): string[] => {
    return getMonthKeys();
  };

  const copyBudgetsToMonth = (fromMonthKey: string, toMonthKey: string) => {
    copyBudgets(fromMonthKey, toMonthKey);
  };

  return (
    <BudgetContext.Provider
      value={{
        currentMonthKey: selectedMonthKey,
        monthData,
        loading,
        switchMonth,
        updateIncome,
        updateBudget,
        updateBudgets,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getMonthData,
        getAllMonthKeys,
        copyBudgets: copyBudgetsToMonth,
        reload,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
