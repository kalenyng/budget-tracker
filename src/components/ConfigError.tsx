import { Wallet } from 'lucide-react';

export function ConfigError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-gray-50 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl border border-red-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Configuration Error
          </h1>
          
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Supabase environment variables are missing. Please create a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file in the project root with:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs">
              <div>VITE_SUPABASE_URL=your-supabase-url</div>
              <div>VITE_SUPABASE_ANON_KEY=your-supabase-key</div>
            </div>

            <p className="text-xs text-gray-500">
              After creating the file, restart your development server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

