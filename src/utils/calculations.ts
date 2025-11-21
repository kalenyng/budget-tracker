import { MonthData, CategoryBudgetInfo } from '@/types';

/**
 * Calculate spent amount for a category in a month
 */
export function calculateSpentForCategory(monthData: MonthData, category: string): number {
  return monthData.transactions
    .filter((t) => t.category === category)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate remaining budget for a category
 */
export function calculateRemainingForCategory(monthData: MonthData, category: string): number {
  const budget = monthData.budgets[category] || 0;
  const spent = calculateSpentForCategory(monthData, category);
  return budget - spent;
}

/**
 * Get budget info for all categories in a month
 */
export function getCategoryBudgetInfo(monthData: MonthData): CategoryBudgetInfo[] {
  const categories = new Set<string>();
  
  // Get all categories from budgets and transactions
  Object.keys(monthData.budgets).forEach((cat) => categories.add(cat));
  monthData.transactions.forEach((t) => categories.add(t.category));

  return Array.from(categories)
    .map((category) => {
      const budget = monthData.budgets[category] || 0;
      const spent = calculateSpentForCategory(monthData, category);
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      return {
        category,
        budget,
        spent,
        remaining,
        percentage,
      };
    })
    .filter((info) => info.budget > 0) // Only show categories with budgets
    .sort((a, b) => b.budget - a.budget); // Sort by budget amount descending
}

/**
 * Get total spent across all categories
 */
export function getTotalSpent(monthData: MonthData): number {
  return monthData.transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get total budget across all categories
 */
export function getTotalBudget(monthData: MonthData): number {
  return Object.values(monthData.budgets).reduce((sum, budget) => sum + budget, 0);
}

/**
 * Get color for budget status (green/yellow/red)
 */
export function getBudgetStatusColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage >= 100) return 'red';
  if (percentage >= 75) return 'yellow';
  return 'green';
}

/**
 * Format month key for display (e.g., "2025-11" -> "November 2025")
 */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

