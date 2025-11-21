import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthData } from '@/types';
import { formatZAR } from '@/utils/budgetCalculations';

interface BalanceLineChartProps {
  monthData: MonthData;
}

export function BalanceLineChart({ monthData }: BalanceLineChartProps) {
  const income = monthData.income ?? 0;
  
  // Sort transactions by date
  const sortedTransactions = [...monthData.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate balance over time
  const balanceData: Array<{ date: string; balance: number; spending: number }> = [];
  
  // Get the first day of the current month for starting point
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Add starting balance point (beginning of month)
  balanceData.push({
    date: firstDayOfMonth.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
    balance: income,
    spending: 0,
  });

  // Group transactions by date
  const transactionsByDate = new Map<string, number>();
  sortedTransactions.forEach((transaction) => {
    const date = new Date(transaction.date).toISOString().split('T')[0];
    const current = transactionsByDate.get(date) || 0;
    transactionsByDate.set(date, current + transaction.amount);
  });

  // Create data points for each day with transactions
  const sortedDates = Array.from(transactionsByDate.keys()).sort();
  let runningBalance = income;
  
  sortedDates.forEach((date) => {
    const daySpending = transactionsByDate.get(date) || 0;
    runningBalance -= daySpending;
    
    balanceData.push({
      date: new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
      balance: runningBalance,
      spending: daySpending,
    });
  });
  
  // Add today's point if no transactions today
  const today = new Date().toISOString().split('T')[0];
  if (!sortedDates.includes(today) && sortedDates.length > 0) {
    balanceData.push({
      date: new Date().toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
      balance: runningBalance,
      spending: 0,
    });
  }

  if (balanceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No balance data to display
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.date}</p>
          <p className={`font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Balance: {formatZAR(data.balance)}
          </p>
          {data.spending > 0 && (
            <p className="text-sm text-gray-600">Spent: {formatZAR(data.spending)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={balanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="balance" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Balance"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

