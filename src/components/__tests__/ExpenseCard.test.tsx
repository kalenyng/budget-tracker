import { render, screen } from '@testing-library/react';
import { ExpenseCard } from '../ExpenseCard';
import { formatZAR } from '@/utils/budgetCalculations';

describe('ExpenseCard', () => {
  it('should render expense card with title and amount', () => {
    render(<ExpenseCard title="Test Expense" amount={100.5} />);
    expect(screen.getByText('Test Expense')).toBeInTheDocument();
    expect(screen.getByText(formatZAR(100.5))).toBeInTheDocument();
  });

  it('should render category when provided', () => {
    render(<ExpenseCard title="Test" amount={100} category="Groceries" />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });
});

