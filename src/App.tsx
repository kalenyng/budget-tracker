import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BudgetProvider, useBudget } from '@/contexts/BudgetContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthForm } from '@/components/AuthForm';
import { ConfigError } from '@/components/ConfigError';
import { BottomNavBar } from '@/components/BottomNavBar';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dashboard } from '@/pages/Dashboard';
import { Budgets } from '@/pages/Budgets';
import { History } from '@/pages/History';
import { Settings } from '@/pages/Settings';
import { isSupabaseConfigured } from '@/lib/supabase';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { reload } = useBudget();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppRoutes />
      <BottomNavBar onOpenSettings={() => setIsSettingsOpen(true)} />
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReset={reload}
      />
    </div>
  );
}

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BudgetProvider>
            <Router>
              <AppContent />
            </Router>
          </BudgetProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
