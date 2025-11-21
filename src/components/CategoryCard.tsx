import { motion } from 'framer-motion';
import { CategoryBudgetInfo } from '@/types';
import { formatZAR } from '@/utils/budgetCalculations';
import { getBudgetStatusColor } from '@/utils/calculations';
import { ProgressBar } from './ProgressBar';
import { 
  ShoppingCart, 
  Car, 
  UtensilsCrossed, 
  Film, 
  MoreHorizontal,
  Home,
  Zap,
  Droplets,
  Heart,
  Dumbbell,
  Wifi
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  groceries: <ShoppingCart className="w-5 h-5" />,
  petrol: <Car className="w-5 h-5" />,
  eatingOut: <UtensilsCrossed className="w-5 h-5" />,
  entertainment: <Film className="w-5 h-5" />,
  random: <MoreHorizontal className="w-5 h-5" />,
  rent: <Home className="w-5 h-5" />,
  electricity: <Zap className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  medicalAid: <Heart className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  internet: <Wifi className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  groceries: 'Groceries',
  petrol: 'Petrol',
  eatingOut: 'Eating Out',
  entertainment: 'Entertainment',
  random: 'Random/Other',
  rent: 'Rent',
  electricity: 'Electricity',
  water: 'Water',
  medicalAid: 'Medical Aid',
  gym: 'Gym',
  internet: 'Internet',
};

interface CategoryCardProps {
  info: CategoryBudgetInfo;
  onClick?: () => void;
}

export function CategoryCard({ info, onClick }: CategoryCardProps) {
  const statusColor = getBudgetStatusColor(info.percentage);
  const icon = categoryIcons[info.category] || <MoreHorizontal className="w-5 h-5" />;
  const label = categoryLabels[info.category] || info.category;

  const cardContent = (
    <div className="glass rounded-2xl p-4 shadow-lg shadow-black/5 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-xs text-gray-500">
              {info.percentage.toFixed(0)}% used
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatZAR(info.remaining)}
          </p>
          <p className="text-xs text-gray-500">remaining</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-medium text-gray-900">{formatZAR(info.budget)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-medium text-gray-900">{formatZAR(info.spent)}</span>
        </div>
        <ProgressBar
          value={info.spent}
          max={info.budget}
          color={statusColor}
          showLabel={false}
        />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="cursor-pointer"
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

