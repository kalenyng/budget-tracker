import { FixedExpense, VariableExpense, DailyExpense, CategoryPercentage, BudgetSummary } from '@/types';

/**
 * Calculate total monthly expenses (ZAR only)
 */
export function calculateMonthlyTotal(
  expenses: (FixedExpense | VariableExpense | DailyExpense)[]
): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Calculate remaining budget after expenses (ZAR only)
 */
export function calculateRemaining(income: number, expenses: number): number {
  return Math.max(0, income - expenses);
}

/**
 * Calculate category percentages of total expenses
 */
export function calculateCategoryPercentages(
  expenses: (FixedExpense | VariableExpense | DailyExpense)[]
): CategoryPercentage[] {
  const total = calculateMonthlyTotal(expenses);
  if (total === 0) return [];

  const categoryMap = new Map<string, number>();

  expenses.forEach((expense) => {
    const category = 'category' in expense ? expense.category : 'daily';
    const current = categoryMap.get(category) || 0;
    categoryMap.set(category, current + expense.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate daily allowance based on remaining budget and days left
 */
export function calculateDailyAllowance(remaining: number, daysLeft: number): number {
  if (daysLeft <= 0) return 0;
  return remaining / daysLeft;
}

/**
 * Simulate income change impact
 */
export function simulateIncomeChange(
  newIncome: number,
  fixed: number,
  variable: number
): { newRemaining: number; change: number } {
  const totalExpenses = fixed + variable;
  const newRemaining = calculateRemaining(newIncome, totalExpenses);
  const change = newIncome - (fixed + variable + newRemaining);
  return { newRemaining, change };
}

/**
 * Validate expense input (ZAR amounts only)
 */
export function validateExpenseInput(amount: string | number): {
  valid: boolean;
  value: number;
  error?: string;
} {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, value: 0, error: 'Please enter a valid number' };
  }

  if (numAmount < 0) {
    return { valid: false, value: 0, error: 'Amount cannot be negative' };
  }

  if (numAmount > 10000000) {
    return { valid: false, value: 0, error: 'Amount is too large' };
  }

  return { valid: true, value: Math.round(numAmount * 100) / 100 }; // Round to 2 decimals
}

/**
 * Calculate complete budget summary
 */
export function calculateBudgetSummary(
  income: number,
  fixedExpenses: FixedExpense[],
  variableExpenses: VariableExpense[],
  dailyExpenses: DailyExpense[],
  currentDate: Date = new Date()
): BudgetSummary {
  const totalFixed = calculateMonthlyTotal(fixedExpenses);
  const totalVariable = calculateMonthlyTotal(variableExpenses);
  const totalDaily = calculateMonthlyTotal(dailyExpenses);
  const totalExpenses = totalFixed + totalVariable + totalDaily;
  const remaining = calculateRemaining(income, totalExpenses);

  // Calculate days left in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysLeft = Math.max(0, daysInMonth - currentDay);

  const dailyAllowance = calculateDailyAllowance(remaining, daysLeft);

  const allExpenses = [...fixedExpenses, ...variableExpenses, ...dailyExpenses];
  const categoryPercentages = calculateCategoryPercentages(allExpenses);

  return {
    totalFixed,
    totalVariable,
    totalDaily,
    totalExpenses,
    remaining,
    dailyAllowance,
    daysLeft,
    categoryPercentages,
  };
}

/**
 * Format ZAR amount for display
 */
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format ZAR amount without currency symbol (for compact display)
 */
export function formatZARCompact(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

