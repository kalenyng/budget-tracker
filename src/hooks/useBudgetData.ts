import { useState, useEffect, useCallback } from 'react';
import { MonthlyData, MonthData, Transaction } from '@/types';
import {
  getAllMonthlyData,
  saveMonthData,
  addTransaction as addTransactionToStorage,
  updateTransaction as updateTransactionInStorage,
  deleteTransaction as deleteTransactionFromStorage,
  updateBudgets as updateBudgetsInStorage,
  updateIncome as updateIncomeInStorage,
  getAllMonthKeys,
  copyBudgetsToMonth,
} from '@/utils/storage';

export function useBudgetData(userId: string) {
  const [data, setData] = useState<MonthlyData>({});
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  const loadData = useCallback(() => {
    if (!userId) {
      setData({});
      setLoading(false);
      return;
    }
    try {
      const allData = getAllMonthlyData(userId);
      setData(allData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get month data
  const getMonth = useCallback(
    (monthKey: string): MonthData | null => {
      return data[monthKey] || null;
    },
    [data]
  );

  // Get or create month data
  const getOrCreateMonth = useCallback(
    (monthKey: string, defaultBudgets?: { [category: string]: number }, defaultIncome?: number): MonthData => {
      const existing = data[monthKey];
      if (existing) {
        return existing;
      }

      // Create new month
      const newData: MonthData = {
        income: defaultIncome ?? 0,
        budgets: defaultBudgets || {},
        transactions: [],
      };

      // Save to storage and update state
      saveMonthData(userId, monthKey, newData);
      setData((prev) => ({ ...prev, [monthKey]: newData }));
      return newData;
    },
    [data, userId]
  );

  // Add transaction
  const addTransaction = useCallback(
    (monthKey: string, transaction: Transaction) => {
      if (!userId) return;
      addTransactionToStorage(userId, monthKey, transaction);
      loadData(); // Reload to update state
    },
    [loadData, userId]
  );

  // Update transaction
  const updateTransaction = useCallback(
    (monthKey: string, transactionId: string, updates: Partial<Transaction>) => {
      if (!userId) return;
      updateTransactionInStorage(userId, monthKey, transactionId, updates);
      loadData();
    },
    [loadData, userId]
  );

  // Delete transaction
  const deleteTransaction = useCallback(
    (monthKey: string, transactionId: string) => {
      if (!userId) return;
      deleteTransactionFromStorage(userId, monthKey, transactionId);
      loadData();
    },
    [loadData, userId]
  );

  // Update budgets
  const updateBudgets = useCallback(
    (monthKey: string, budgets: { [category: string]: number }) => {
      if (!userId) return;
      updateBudgetsInStorage(userId, monthKey, budgets);
      loadData();
    },
    [loadData, userId]
  );

  // Get all month keys
  const getMonthKeys = useCallback((): string[] => {
    if (!userId) return [];
    return getAllMonthKeys(userId);
  }, [userId]);

  // Update income
  const updateIncome = useCallback(
    (monthKey: string, income: number) => {
      if (!userId) return;
      updateIncomeInStorage(userId, monthKey, income);
      loadData();
    },
    [loadData, userId]
  );

  // Copy budgets from one month to another
  const copyBudgets = useCallback(
    (fromMonthKey: string, toMonthKey: string) => {
      if (!userId) return;
      copyBudgetsToMonth(userId, fromMonthKey, toMonthKey);
      loadData();
    },
    [loadData, userId]
  );

  return {
    data,
    loading,
    getMonth,
    getOrCreateMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudgets,
    updateIncome,
    getMonthKeys,
    copyBudgets,
    reload: loadData,
  };
}

