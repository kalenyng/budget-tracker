import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Transaction } from '@/types';
import { parseCsvFile, ParsedTransaction } from '@/utils/csvParser';
import { parsePdfFile } from '@/utils/pdfParser';
import { categorizeTransactions, isOpenRouterConfigured } from '@/lib/openrouter';
import { formatZAR } from '@/utils/budgetCalculations';
import { useBudget } from '@/contexts/BudgetContext';

interface CsvImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
}

interface CategorizedTransaction extends ParsedTransaction {
  category: string;
  confidence?: number;
  selected: boolean;
}

export function CsvImportSheet({ isOpen, onClose, onImport }: CsvImportSheetProps) {
  const { monthData } = useBudget();
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all existing categories from budgets and transactions
  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    if (monthData) {
      Object.keys(monthData.budgets).forEach((cat) => categories.add(cat));
      monthData.transactions.forEach((t) => categories.add(t.category));
    }
    // Add a default "Other" category if no categories exist
    if (categories.size === 0) {
      categories.add('Other');
    }
    return Array.from(categories).sort();
  }, [monthData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isCsv = selectedFile.name.toLowerCase().endsWith('.csv');
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isCsv && !isPdf) {
      setError('Please select a CSV or PDF file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (isCsv) {
        result = await parseCsvFile(selectedFile);
      } else {
        // PDF parsing
        result = await parsePdfFile(selectedFile, isOpenRouterConfigured);
      }
      
      if (result.errors.length > 0) {
        setError(result.errors.join('\n'));
        setLoading(false);
        return;
      }

      if (result.transactions.length === 0) {
        setError(`No transactions found in ${isCsv ? 'CSV' : 'PDF'} file`);
        setLoading(false);
        return;
      }

      // Initialize transactions with default category
      const defaultCategory = existingCategories.length > 0 ? existingCategories[0] : 'Other';
      const initialTransactions: CategorizedTransaction[] = result.transactions.map((t) => ({
        ...t,
        category: defaultCategory,
        selected: true,
      }));

      setTransactions(initialTransactions);
      setLoading(false);

      // Auto-categorize if OpenRouter is configured and not already categorized by PDF AI
      // PDF parser may have already used AI for extraction, so we only categorize if needed
      if (isOpenRouterConfigured && initialTransactions.length > 0 && isCsv) {
        await handleCategorize(initialTransactions);
      } else if (isOpenRouterConfigured && initialTransactions.length > 0 && isPdf) {
        // For PDFs, we still want to categorize even if extraction used AI
        await handleCategorize(initialTransactions);
      }
    } catch (err) {
      setError(`Failed to parse ${isCsv ? 'CSV' : 'PDF'}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleCategorize = async (txns?: CategorizedTransaction[]) => {
    const txnsToCategorize = txns || transactions;
    if (txnsToCategorize.length === 0) return;

    if (!isOpenRouterConfigured) {
      setError('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in your .env file');
      return;
    }

    setCategorizing(true);
    setError('');

    try {
      // Batch categorize in chunks of 10 to avoid token limits
      const chunkSize = 10;
      const chunks: CategorizedTransaction[][] = [];
      
      for (let i = 0; i < txnsToCategorize.length; i += chunkSize) {
        chunks.push(txnsToCategorize.slice(i, i + chunkSize));
      }

      const categorized: CategorizedTransaction[] = [];

      for (const chunk of chunks) {
        const requests = chunk.map((t) => ({
          description: t.description,
          amount: t.amount,
          date: t.date,
        }));

        const results = await categorizeTransactions(requests);

        chunk.forEach((t, idx) => {
          const result = results[idx];
          categorized.push({
            ...t,
            category: result.category,
            confidence: result.confidence,
          });
        });
      }

      setTransactions(categorized);
    } catch (err) {
      setError(`Failed to categorize transactions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCategorizing(false);
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    const updated = [...transactions];
    updated[index].category = category;
    setTransactions(updated);
  };

  const handleNewCategoryChange = (index: number, categoryName: string) => {
    const updated = [...transactions];
    updated[index].category = categoryName.trim();
    setTransactions(updated);
  };

  const handleToggleSelect = (index: number) => {
    const updated = [...transactions];
    updated[index].selected = !updated[index].selected;
    setTransactions(updated);
  };

  const handleBulkCategoryChange = () => {
    const finalCategory = isNewCategory ? newCategoryName.trim() : bulkCategory;
    if (!finalCategory) return;
    
    const updated = transactions.map((t) =>
      t.selected ? { ...t, category: finalCategory } : t
    );
    setTransactions(updated);
    setBulkCategory('');
    setIsNewCategory(false);
    setNewCategoryName('');
  };

  const handleSelectAll = () => {
    const allSelected = transactions.every((t) => t.selected);
    const updated = transactions.map((t) => ({ ...t, selected: !allSelected }));
    setTransactions(updated);
  };

  const handleImport = () => {
    const selectedTransactions = transactions.filter((t) => t.selected);
    
    if (selectedTransactions.length === 0) {
      setError('Please select at least one transaction to import');
      return;
    }

    const transactionsToImport: Omit<Transaction, 'id'>[] = selectedTransactions.map((t) => ({
      date: new Date(t.date).toISOString(),
      amount: t.amount,
      category: t.category,
      note: t.description,
    }));

    onImport(transactionsToImport);
    
    // Reset state
    setFile(null);
    setTransactions([]);
    setSearchQuery('');
    setBulkCategory('');
    setIsNewCategory(false);
    setNewCategoryName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  const handleClose = () => {
    setFile(null);
    setTransactions([]);
    setSearchQuery('');
    setBulkCategory('');
    setIsNewCategory(false);
    setNewCategoryName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const filteredTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = transactions.filter((t) => t.selected).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Statement</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* File Upload */}
              {!file && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload CSV or PDF file
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Bank statements (CSV or PDF)
                    </p>
                  </label>
                </div>
              )}

              {file && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transactions.length} transactions found
                      </p>
                    </div>
                  </div>
                  {!isOpenRouterConfigured && (
                    <button
                      onClick={() => handleCategorize()}
                      disabled={categorizing || transactions.length === 0}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {categorizing ? 'Categorizing...' : 'Categorize with AI'}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-line">{error}</div>
                </div>
              )}

              {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Parsing {file?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'CSV'} file...</span>
                </div>
              )}

              {categorizing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Categorizing transactions with AI...</span>
                </div>
              )}
            </div>

            {/* Transactions List */}
            {transactions.length > 0 && (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Search and Bulk Actions */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {transactions.every((t) => t.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                    <div className="flex-1 flex gap-2">
                      {!isNewCategory ? (
                        <>
                          <select
                            value={bulkCategory}
                            onChange={(e) => setBulkCategory(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">Bulk change category...</option>
                            {existingCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewCategory(true);
                              setBulkCategory('');
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                          >
                            New
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name"
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewCategory(false);
                              setNewCategoryName('');
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                    {(bulkCategory || (isNewCategory && newCategoryName.trim())) && (
                      <button
                        onClick={handleBulkCategoryChange}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="space-y-2">
                  {filteredTransactions.map((transaction) => {
                    const actualIndex = transactions.indexOf(transaction);
                    return (
                      <motion.div
                        key={actualIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={transaction.selected}
                            onChange={() => handleToggleSelect(actualIndex)}
                            className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(transaction.date).toLocaleDateString('en-ZA', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                {formatZAR(transaction.amount)}
                              </p>
                            </div>
                            <select
                              value={transaction.category}
                              onChange={(e) => handleCategoryChange(actualIndex, e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              {existingCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              {!existingCategories.includes(transaction.category) && (
                                <option value={transaction.category}>{transaction.category}</option>
                              )}
                            </select>
                            {transaction.confidence !== undefined && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                AI confidence: {(transaction.confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No transactions match your search
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {transactions.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCount} of {transactions.length} transactions selected
                  </p>
                </div>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
