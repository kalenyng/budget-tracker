import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CategoryBudgetInfo } from '@/types';
import { formatZAR } from '@/utils/budgetCalculations';

interface SpendingBarChartProps {
  data: CategoryBudgetInfo[];
}


export function SpendingBarChart({ data }: SpendingBarChartProps) {
  // Filter out categories with no spending and sort by spent amount
  const chartData = data
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .map((item) => ({
      name: item.category,
      spent: item.spent,
      budget: item.budget,
      remaining: item.remaining,
      category: item.category,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No spending data to display
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-primary font-bold">Spent: {formatZAR(data.spent)}</p>
          <p className="text-gray-600">Budget: {formatZAR(data.budget)}</p>
          <p className={`text-sm ${data.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Remaining: {formatZAR(data.remaining)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 11 }}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="spent" fill="#8b5cf6" name="Spent" radius={[4, 4, 0, 0]} />
        <Bar dataKey="budget" fill="#e5e7eb" name="Budget" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

