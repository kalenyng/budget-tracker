import { getCurrentMonth, getCurrentBudget } from '../db';

// Mock idb
jest.mock('idb', () => ({
  openDB: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
      put: jest.fn(),
      getAll: jest.fn(() => Promise.resolve([])),
      getFromIndex: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    })
  ),
}));

describe('Database Functions', () => {
  describe('getCurrentMonth', () => {
    it('should return current month in YYYY-MM format', () => {
      const month = getCurrentMonth();
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('getCurrentBudget', () => {
    it('should return a budget object', async () => {
      const budget = await getCurrentBudget();
      expect(budget).toHaveProperty('id');
      expect(budget).toHaveProperty('month');
      expect(budget).toHaveProperty('income');
      expect(budget).toHaveProperty('fixedExpenses');
      expect(budget).toHaveProperty('variableExpenses');
      expect(budget).toHaveProperty('dailyExpenses');
    });
  });
});

