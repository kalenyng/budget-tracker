// Legacy types (kept for backward compatibility during migration)
export interface FixedExpense {
  id: string;
  name: string;
  amount: number; // ZAR only
  category: 'rent' | 'electricity' | 'water' | 'medicalAid' | 'gym' | 'internet';
}

export interface VariableExpense {
  id: string;
  name: string;
  amount: number; // ZAR only
  category: 'groceries' | 'petrol' | 'eatingOut' | 'entertainment' | 'random';
}

export interface DailyExpense {
  id: string;
  date: string; // ISO date string
  amount: number; // ZAR only
  category: string;
  description: string;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM format
  income: number; // ZAR only
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  dailyExpenses: DailyExpense[];
  createdAt: string;
  updatedAt: string;
}

// New monthly budgeting system types
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note?: string;
  date: string; // ISO date string
}

export interface MonthData {
  income?: number; // Optional, defaults to 0
  budgets: {
    [category: string]: number;
  };
  transactions: Transaction[];
}

export interface MonthlyData {
  [monthKey: string]: MonthData; // monthKey format: "2025-11"
}

export type ExpenseCategory = 
  | 'groceries' 
  | 'petrol' 
  | 'eatingOut' 
  | 'entertainment' 
  | 'random'
  | 'rent'
  | 'electricity'
  | 'water'
  | 'medicalAid'
  | 'gym'
  | 'internet';

export interface CategoryPercentage {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetSummary {
  totalFixed: number;
  totalVariable: number;
  totalDaily: number;
  totalExpenses: number;
  remaining: number;
  dailyAllowance: number;
  daysLeft: number;
  categoryPercentages: CategoryPercentage[];
}

export interface CategoryBudgetInfo {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

