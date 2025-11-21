import {
  calculateMonthlyTotal,
  calculateRemaining,
  calculateCategoryPercentages,
  calculateDailyAllowance,
  simulateIncomeChange,
  validateExpenseInput,
  calculateBudgetSummary,
  formatZAR,
} from '../budgetCalculations';
import { FixedExpense, VariableExpense, DailyExpense } from '@/types';

describe('Budget Calculations', () => {
  describe('calculateMonthlyTotal', () => {
    it('should calculate total of expenses', () => {
      const expenses: FixedExpense[] = [
        { id: '1', name: 'Rent', amount: 5000, category: 'rent' },
        { id: '2', name: 'Electricity', amount: 500, category: 'electricity' },
      ];
      expect(calculateMonthlyTotal(expenses)).toBe(5500);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMonthlyTotal([])).toBe(0);
    });
  });

  describe('calculateRemaining', () => {
    it('should calculate remaining budget correctly', () => {
      expect(calculateRemaining(10000, 7000)).toBe(3000);
    });

    it('should return 0 if expenses exceed income', () => {
      expect(calculateRemaining(5000, 7000)).toBe(0);
    });
  });

  describe('calculateCategoryPercentages', () => {
    it('should calculate category percentages correctly', () => {
      const expenses: (FixedExpense | VariableExpense)[] = [
        { id: '1', name: 'Rent', amount: 5000, category: 'rent' },
        { id: '2', name: 'Groceries', amount: 2000, category: 'groceries' },
        { id: '3', name: 'Petrol', amount: 1000, category: 'petrol' },
      ];
      const result = calculateCategoryPercentages(expenses);
      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('rent');
      expect(result[0].percentage).toBeCloseTo(62.5, 1);
    });

    it('should return empty array for no expenses', () => {
      expect(calculateCategoryPercentages([])).toEqual([]);
    });
  });

  describe('calculateDailyAllowance', () => {
    it('should calculate daily allowance correctly', () => {
      expect(calculateDailyAllowance(3000, 10)).toBe(300);
    });

    it('should return 0 if days left is 0', () => {
      expect(calculateDailyAllowance(3000, 0)).toBe(0);
    });
  });

  describe('simulateIncomeChange', () => {
    it('should simulate income change correctly', () => {
      const result = simulateIncomeChange(15000, 5000, 3000);
      expect(result.newRemaining).toBe(7000);
    });
  });

  describe('validateExpenseInput', () => {
    it('should validate valid amount', () => {
      const result = validateExpenseInput('100.50');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(100.5);
    });

    it('should reject negative amounts', () => {
      const result = validateExpenseInput('-100');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount cannot be negative');
    });

    it('should reject non-numeric input', () => {
      const result = validateExpenseInput('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });

    it('should reject amounts that are too large', () => {
      const result = validateExpenseInput('20000000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount is too large');
    });
  });

  describe('calculateBudgetSummary', () => {
    it('should calculate complete budget summary', () => {
      const fixed: FixedExpense[] = [
        { id: '1', name: 'Rent', amount: 5000, category: 'rent' },
      ];
      const variable: VariableExpense[] = [
        { id: '2', name: 'Groceries', amount: 2000, category: 'groceries' },
      ];
      const daily: DailyExpense[] = [
        {
          id: '3',
          date: '2024-01-15',
          amount: 100,
          category: 'eatingOut',
          description: 'Lunch',
        },
      ];

      const summary = calculateBudgetSummary(10000, fixed, variable, daily);
      expect(summary.totalFixed).toBe(5000);
      expect(summary.totalVariable).toBe(2000);
      expect(summary.totalDaily).toBe(100);
      expect(summary.totalExpenses).toBe(7100);
      expect(summary.remaining).toBe(2900);
      expect(summary.categoryPercentages.length).toBeGreaterThan(0);
    });
  });

  describe('formatZAR', () => {
    it('should format ZAR correctly', () => {
      const formatted = formatZAR(1234.56);
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('56');
    });
  });
});

