import { useState, useEffect } from 'react';
import { validateExpenseInput, formatZAR } from '@/utils/budgetCalculations';
import { Wallet } from 'lucide-react';

interface IncomeEditorProps {
  income: number;
  onSave: (income: number) => void;
}

export function IncomeEditor({ income, onSave }: IncomeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(income.toString());
  const [error, setError] = useState('');

  // Update value when income prop changes
  useEffect(() => {
    if (!isEditing) {
      setValue(income.toString());
    }
  }, [income, isEditing]);

  const handleSave = () => {
    setError('');
    const validation = validateExpenseInput(value);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    onSave(validation.value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(income.toString());
    setIsEditing(false);
    setError('');
  };

  if (isEditing) {
    return (
      <div className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Income (ZAR)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
            autoFocus
          />
          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatZAR(income)}</p>
          </div>
        </div>
        <button className="text-primary text-sm font-medium">Edit</button>
      </div>
    </div>
  );
}

