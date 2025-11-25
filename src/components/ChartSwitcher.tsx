import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { CategoryBudgetInfo, MonthData } from '@/types';
import { SpendingPieChart } from './SpendingPieChart';
import { SpendingBarChart } from './SpendingBarChart';
import { BalanceLineChart } from './BalanceLineChart';

export type ChartType = 'pie' | 'bar' | 'line';

interface ChartSwitcherProps {
  categoryData: CategoryBudgetInfo[];
  monthData: MonthData;
}

const chartTypes: Array<{ type: ChartType; label: string; icon: React.ReactNode }> = [
  { type: 'pie', label: 'Pie', icon: <PieChartIcon className="w-4 h-4" /> },
  { type: 'bar', label: 'Bar', icon: <BarChart3 className="w-4 h-4" /> },
  { type: 'line', label: 'Balance', icon: <TrendingUp className="w-4 h-4" /> },
];

export function ChartSwitcher({ categoryData, monthData }: ChartSwitcherProps) {
  const [currentChart, setCurrentChart] = useState<ChartType>('pie');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next chart
      const currentIndex = chartTypes.findIndex((c) => c.type === currentChart);
      const nextIndex = (currentIndex + 1) % chartTypes.length;
      setCurrentChart(chartTypes[nextIndex].type);
    } else if (isRightSwipe) {
      // Swipe right - previous chart
      const currentIndex = chartTypes.findIndex((c) => c.type === currentChart);
      const prevIndex = (currentIndex - 1 + chartTypes.length) % chartTypes.length;
      setCurrentChart(chartTypes[prevIndex].type);
    }
  };

  const renderChart = () => {
    switch (currentChart) {
      case 'pie':
        return <SpendingPieChart data={categoryData} />;
      case 'bar':
        return <SpendingBarChart data={categoryData} />;
      case 'line':
        return <BalanceLineChart monthData={monthData} />;
      default:
        return <SpendingPieChart data={categoryData} />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Chart Type Selector - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex gap-2 justify-center">
        {chartTypes.map((chart) => (
          <button
            key={chart.type}
            onClick={() => setCurrentChart(chart.type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChart === chart.type
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {chart.icon}
            <span>{chart.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile indicator dots */}
      <div className="md:hidden flex justify-center gap-2">
        {chartTypes.map((chart) => (
          <button
            key={chart.type}
            onClick={() => setCurrentChart(chart.type)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentChart === chart.type ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Switch to ${chart.label} chart`}
          />
        ))}
      </div>

      {/* Chart Container with Swipe Support */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden"
      >
        <motion.div
          key={currentChart}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderChart()}
        </motion.div>
      </div>

      {/* Mobile swipe hint */}
      <p className="md:hidden text-xs text-center text-gray-400 dark:text-gray-500">
        Swipe left/right to change chart
      </p>
    </div>
  );
}

