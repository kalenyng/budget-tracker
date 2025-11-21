import { supabase } from './supabase';
import { MonthlyBudget } from '@/types';

// Helper to transform database row to MonthlyBudget
function transformRow(row: any): MonthlyBudget {
  return {
    id: row.id,
    month: row.month,
    income: parseFloat(row.income),
    fixedExpenses: row.fixed_expenses || [],
    variableExpenses: row.variable_expenses || [],
    dailyExpenses: row.daily_expenses || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to transform MonthlyBudget to database row
function transformBudget(budget: MonthlyBudget, userId: string) {
  return {
    id: budget.id,
    user_id: userId,
    month: budget.month,
    income: budget.income,
    fixed_expenses: budget.fixedExpenses,
    variable_expenses: budget.variableExpenses,
    daily_expenses: budget.dailyExpenses,
  };
}

/**
 * Get current month's budget (YYYY-MM format)
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get or create current month's budget
 */
export async function getCurrentBudget(): Promise<MonthlyBudget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const month = getCurrentMonth();
  
  // Try to get existing budget
  const { data: existing, error: fetchError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .single();
  
  // If we got data and no error, return it
  if (existing && !fetchError) {
    return transformRow(existing);
  }

  // If error is "no rows found" (PGRST116), create a new budget
  // Otherwise, it's a real error (network, auth, etc.) - throw it
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch budget: ${fetchError.message}`);
  }

  // Create new budget if it doesn't exist
  const newBudget: MonthlyBudget = {
    id: crypto.randomUUID(),
    month,
    income: 0,
    fixedExpenses: [],
    variableExpenses: [],
    dailyExpenses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from('budgets')
    .insert(transformBudget(newBudget, user.id))
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create budget: ${insertError.message}`);
  }

  if (!inserted) {
    throw new Error('Failed to create budget: No data returned');
  }

  return transformRow(inserted);
}

/**
 * Save budget
 */
export async function saveBudget(budget: MonthlyBudget): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  budget.updatedAt = new Date().toISOString();
  
  const { error } = await supabase
    .from('budgets')
    .upsert(transformBudget(budget, user.id), {
      onConflict: 'id',
    });

  if (error) {
    throw new Error(`Failed to save budget: ${error.message}`);
  }
}

/**
 * Get all budgets
 */
export async function getAllBudgets(): Promise<MonthlyBudget[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }

  return (data || []).map(transformRow);
}

/**
 * Get budget by month
 */
export async function getBudgetByMonth(month: string): Promise<MonthlyBudget | undefined> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return undefined;
    }
    throw new Error(`Failed to fetch budget: ${error.message}`);
  }

  return data ? transformRow(data) : undefined;
}

/**
 * Delete budget
 */
export async function deleteBudget(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to clear data: ${error.message}`);
  }
}

