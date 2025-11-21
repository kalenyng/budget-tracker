import React, { useState, useEffect } from 'react';
import { FixedExpense } from '@/types';
import { validateExpenseInput } from '@/utils/budgetCalculations';
import { X } from 'lucide-react';

interface FixedExpenseEditorProps {
  expense?: FixedExpense;
  onSave: (expense: Omit<FixedExpense, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const fixedCategories = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'medicalAid', label: 'Medical Aid' },
  { value: 'gym', label: 'Gym' },
  { value: 'internet', label: 'Internet' },
];

export function FixedExpenseEditor({
  expense,
  onSave,
  onCancel,
  onDelete,
}: FixedExpenseEditorProps) {
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [category, setCategory] = useState<FixedExpense['category']>(
    expense?.category || 'rent'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
    } else {
      // Reset form when switching to add mode
      setName('');
      setAmount('');
      setCategory('rent');
      setError('');
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    const validation = validateExpenseInput(amount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    onSave({
      name: name.trim(),
      amount: validation.value,
      category,
    });

    // Reset form if adding new expense (not editing)
    if (!expense) {
      setName('');
      setAmount('');
      setCategory('rent');
    }
  };

  return (
    <div className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">
            {expense ? 'Edit' : 'Add'} Fixed Expense
          </h3>
          <div className="flex items-center gap-2">
            {expense && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Expense name"
          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="Amount (ZAR)"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as FixedExpense['category'])}
            className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {fixedCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          {expense ? 'Update' : 'Add'}
        </button>
      </form>
    </div>
  );
}

