import { MonthlyData, MonthData, Transaction } from '@/types';

/**
 * Get storage key for a specific user
 */
function getStorageKey(userId: string): string {
  return `budget-tracker-monthly-data-${userId}`;
}

/**
 * Get current month key in format "YYYY-MM"
 */
export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get all monthly data from localStorage for a specific user
 */
export function getAllMonthlyData(userId: string): MonthlyData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }
    if (!userId) {
      return {};
    }
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed as MonthlyData;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return {};
  }
}

/**
 * Save all monthly data to localStorage for a specific user
 */
export function saveAllMonthlyData(userId: string, data: MonthlyData): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return;
    }
    if (!userId) {
      console.warn('Cannot save data: no user ID');
      return;
    }
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    // Don't throw - just log the error to prevent app crashes
  }
}

/**
 * Get data for a specific month
 */
export function getMonthData(userId: string, monthKey: string): MonthData | null {
  const allData = getAllMonthlyData(userId);
  return allData[monthKey] || null;
}

/**
 * Save data for a specific month
 */
export function saveMonthData(userId: string, monthKey: string, data: MonthData): void {
  const allData = getAllMonthlyData(userId);
  allData[monthKey] = data;
  saveAllMonthlyData(userId, allData);
}

/**
 * Get or create month data (creates with default budgets if doesn't exist)
 */
export function getOrCreateMonthData(userId: string, monthKey: string, defaultBudgets?: { [category: string]: number }, defaultIncome?: number): MonthData {
  const existing = getMonthData(userId, monthKey);
  if (existing) {
    return existing;
  }

  // Create new month with default budgets or empty budgets
  const newData: MonthData = {
    income: defaultIncome ?? 0,
    budgets: defaultBudgets || {},
    transactions: [],
  };

  saveMonthData(userId, monthKey, newData);
  return newData;
}

/**
 * Add a transaction to a month
 */
export function addTransaction(userId: string, monthKey: string, transaction: Transaction): void {
  const monthData = getOrCreateMonthData(userId, monthKey);
  monthData.transactions.push(transaction);
  saveMonthData(userId, monthKey, monthData);
}

/**
 * Update a transaction in a month
 */
export function updateTransaction(userId: string, monthKey: string, transactionId: string, updates: Partial<Transaction>): void {
  const monthData = getMonthData(userId, monthKey);
  if (!monthData) {
    throw new Error(`Month ${monthKey} not found`);
  }

  const index = monthData.transactions.findIndex((t) => t.id === transactionId);
  if (index === -1) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  monthData.transactions[index] = { ...monthData.transactions[index], ...updates };
  saveMonthData(userId, monthKey, monthData);
}

/**
 * Delete a transaction from a month
 */
export function deleteTransaction(userId: string, monthKey: string, transactionId: string): void {
  const monthData = getMonthData(userId, monthKey);
  if (!monthData) {
    throw new Error(`Month ${monthKey} not found`);
  }

  monthData.transactions = monthData.transactions.filter((t) => t.id !== transactionId);
  saveMonthData(userId, monthKey, monthData);
}

/**
 * Update budgets for a month
 */
export function updateBudgets(userId: string, monthKey: string, budgets: { [category: string]: number }): void {
  const monthData = getOrCreateMonthData(userId, monthKey);
  monthData.budgets = { ...monthData.budgets, ...budgets };
  saveMonthData(userId, monthKey, monthData);
}

/**
 * Get all available month keys (sorted descending)
 */
export function getAllMonthKeys(userId: string): string[] {
  const allData = getAllMonthlyData(userId);
  return Object.keys(allData).sort((a, b) => b.localeCompare(a));
}

/**
 * Copy budgets from one month to another
 */
export function copyBudgetsToMonth(userId: string, fromMonthKey: string, toMonthKey: string): void {
  const fromData = getMonthData(userId, fromMonthKey);
  if (!fromData) {
    return;
  }

  const toData = getOrCreateMonthData(userId, toMonthKey);
  toData.budgets = { ...fromData.budgets };
  toData.income = fromData.income ?? 0;
  saveMonthData(userId, toMonthKey, toData);
}

/**
 * Update income for a month
 */
export function updateIncome(userId: string, monthKey: string, income: number): void {
  const monthData = getOrCreateMonthData(userId, monthKey);
  monthData.income = income;
  saveMonthData(userId, monthKey, monthData);
}

