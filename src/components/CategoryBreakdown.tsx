import { CategoryPercentage } from '@/types';
import { formatZAR } from '@/utils/budgetCalculations';
import { ProgressBar } from './ProgressBar';

interface CategoryBreakdownProps {
  categories: CategoryPercentage[];
  total: number;
}

export function CategoryBreakdown({ categories, total }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
        <p className="text-gray-400 dark:text-gray-500 text-center">No expenses to display</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Breakdown</h3>
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {category.category.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">{formatZAR(category.amount)}</span>
                <span className="text-gray-400 dark:text-gray-500">({category.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <ProgressBar
              value={category.amount}
              max={total}
              color={
                category.percentage > 30
                  ? 'red'
                  : category.percentage > 20
                  ? 'yellow'
                  : 'primary'
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

