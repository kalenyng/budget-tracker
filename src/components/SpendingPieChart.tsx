import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryBudgetInfo } from '@/types';
import { formatZAR } from '@/utils/budgetCalculations';
import { useTheme } from '@/contexts/ThemeContext';

interface SpendingPieChartProps {
  data: CategoryBudgetInfo[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#06b6d4'];

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  const { isDark } = useTheme();
  
  // Filter out categories with no spending
  const chartData = data
    .filter((item) => item.spent > 0)
    .map((item) => ({
      name: item.category,
      value: item.spent,
      category: item.category,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
        No spending data to display
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
          <p className="text-primary font-bold">{formatZAR(data.value)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          outerRadius={70}
          fill="#8884d8"
          dataKey="value"
          stroke="none"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => {
            const total = chartData.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((entry.payload.value / total) * 100).toFixed(0);
            return `${value} (${percentage}%)`;
          }}
          wrapperStyle={{ 
            fontSize: '12px',
            color: isDark ? '#e5e7eb' : '#111827'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

