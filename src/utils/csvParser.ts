export interface ParsedTransaction {
  date: string; // ISO date string
  description: string;
  amount: number;
  reference?: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
}

/**
 * Common date format patterns for bank statements
 */
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
];

/**
 * Parse a date string in various formats to ISO format (YYYY-MM-DD)
 */
function parseDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  const trimmed = dateStr.trim();

  // Already in ISO format
  if (DATE_PATTERNS[0].test(trimmed)) {
    return trimmed;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  // Try YYYY/MM/DD
  const yyyymmdd = trimmed.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month}-${day}`;
  }

  // Try native Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Fallback to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse amount string to number
 * Handles formats like: "R1,234.56", "-R500.00", "1234.56", etc.
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || typeof amountStr !== 'string') {
    return 0;
  }

  // Remove currency symbols, spaces, and commas
  const cleaned = amountStr
    .replace(/[R$\s,]/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed); // Always return positive (expenses)
}

/**
 * Find column index by name (case-insensitive, handles variations)
 */
function findColumnIndex(
  headers: string[],
  possibleNames: string[]
): number {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  
  for (const name of possibleNames) {
    const normalized = name.toLowerCase().trim();
    const index = normalizedHeaders.findIndex((h) => h.includes(normalized) || normalized.includes(h));
    if (index !== -1) {
      return index;
    }
  }
  
  return -1;
}

/**
 * Parse CSV content into transactions
 */
export function parseCsv(csvContent: string): ParseResult {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    errors.push('CSV file is empty');
    return { transactions, errors };
  }

  // Split into lines
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { transactions, errors };
  }

  // Parse header row
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  
  // Find column indices
  const dateIndex = findColumnIndex(headers, ['date', 'transaction date', 'posting date', 'value date']);
  const descriptionIndex = findColumnIndex(headers, [
    'description',
    'details',
    'narration',
    'reference',
    'transaction details',
    'particulars',
    'memo',
  ]);
  const amountIndex = findColumnIndex(headers, ['amount', 'debit', 'credit', 'value', 'transaction amount']);
  const referenceIndex = findColumnIndex(headers, ['reference', 'ref', 'transaction id', 'id', 'transaction reference']);

  // Validate required columns
  if (dateIndex === -1) {
    errors.push('Could not find Date column. Expected: date, transaction date, posting date, or value date');
  }
  if (descriptionIndex === -1) {
    errors.push('Could not find Description column. Expected: description, details, narration, or reference');
  }
  if (amountIndex === -1) {
    errors.push('Could not find Amount column. Expected: amount, debit, credit, or value');
  }

  if (errors.length > 0) {
    return { transactions, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      // Extract values
      const dateStr = values[dateIndex] || '';
      const description = (values[descriptionIndex] || '').trim();
      const amountStr = values[amountIndex] || '';
      const reference = referenceIndex !== -1 ? (values[referenceIndex] || '').trim() : undefined;

      // Skip empty rows
      if (!description && !amountStr) {
        continue;
      }

      const amount = parseAmount(amountStr);
      const date = parseDate(dateStr);

      // Skip zero amounts
      if (amount === 0) {
        continue;
      }

      transactions.push({
        date,
        description,
        amount,
        reference,
      });
    } catch (error) {
      errors.push(`Error parsing row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (transactions.length === 0 && errors.length === 0) {
    errors.push('No valid transactions found in CSV file');
  }

  return { transactions, errors };
}

/**
 * Parse CSV file from File object
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return parseCsv(text);
  } catch (error) {
    return {
      transactions: [],
      errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

