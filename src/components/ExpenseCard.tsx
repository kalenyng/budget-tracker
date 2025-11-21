import React from 'react';
import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import { formatZAR } from '@/utils/budgetCalculations';
import { cn } from '@/lib/utils';

interface ExpenseCardProps {
  title: string;
  amount: number;
  category?: string;
  icon?: React.ReactNode;
  onEdit?: () => void;
  className?: string;
}

export function ExpenseCard({
  title,
  amount,
  category,
  icon,
  onEdit,
  className,
}: ExpenseCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            {category && (
              <p className="text-sm text-gray-500 truncate">{category}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <p className="font-bold text-gray-900 text-lg">{formatZAR(amount)}</p>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Edit expense"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

