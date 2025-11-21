import { motion } from 'framer-motion';
import { formatZAR } from '@/utils/budgetCalculations';
import { BudgetSummary } from '@/types';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  summary: BudgetSummary;
  income: number;
}

export function SummaryCard({ summary, income }: SummaryCardProps) {
  const isPositive = summary.remaining >= 0;
  const percentageUsed = income > 0 ? (summary.totalExpenses / income) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100"
    >
      <div className="space-y-4">
        {/* Income */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-gray-600 font-medium">Monthly Income</span>
          </div>
          <span className="font-bold text-xl text-gray-900">{formatZAR(income)}</span>
        </div>

        {/* Total Expenses */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Total Expenses</span>
          <span className="font-bold text-lg text-gray-900">{formatZAR(summary.totalExpenses)}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Budget Used</span>
            <span className="text-gray-700 font-medium">{percentageUsed.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentageUsed, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                percentageUsed > 90 ? 'bg-red-500' : percentageUsed > 70 ? 'bg-yellow-500' : 'bg-primary'
              )}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-gray-600 font-medium">Remaining</span>
            </div>
            <span className={cn(
              'font-bold text-2xl',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {formatZAR(summary.remaining)}
            </span>
          </div>
        </div>

        {/* Daily Allowance */}
        {summary.daysLeft > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {summary.daysLeft} days left
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {formatZAR(summary.dailyAllowance)}/day
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

