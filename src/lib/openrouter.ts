import { getCachedCategory, cacheCategory, getRuleBasedCategory } from '../utils/categorizationCache';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free model options - using meta-llama/llama-3.2-3b-instruct:free as it's reliable
const FREE_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

export const isOpenRouterConfigured = !!OPENROUTER_API_KEY;

export interface CategorizationRequest {
  description: string;
  amount: number;
  date?: string;
}

export interface CategorizedTransaction {
  description: string;
  amount: number;
  date: string;
  category: string;
  confidence?: number;
}

const VALID_CATEGORIES = [
  'groceries',
  'petrol',
  'eatingOut',
  'entertainment',
  'random',
  'rent',
  'electricity',
  'water',
  'medicalAid',
  'gym',
  'internet',
];

/**
 * Categorize a batch of transactions using OpenRouter AI
 */
export async function categorizeTransactions(
  transactions: CategorizationRequest[]
): Promise<CategorizedTransaction[]> {
  if (!isOpenRouterConfigured) {
    throw new Error('OpenRouter API key not configured');
  }

  if (transactions.length === 0) {
    return [];
  }

  // Pre-process: Check cache and rules
  const toCategorize: Array<{
    transaction: CategorizationRequest;
    index: number;
    category?: string;
  }> = [];
  
  const results: Array<{ category: string; confidence: number }> = [];
  
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    
    // Try rule-based first (fastest, no API call)
    const ruleCategory = getRuleBasedCategory(t.description);
    if (ruleCategory) {
      results[i] = { category: ruleCategory, confidence: 0.95 };
      cacheCategory(t.description, ruleCategory, 0.95);
      continue;
    }
    
    // Try cache
    const cachedCategory = getCachedCategory(t.description);
    if (cachedCategory) {
      results[i] = { category: cachedCategory, confidence: 0.9 };
      continue;
    }
    
    // Need AI categorization
    toCategorize.push({ transaction: t, index: i });
  }
  
  // If all were cached/ruled, return early
  if (toCategorize.length === 0) {
    return transactions.map((t, idx) => ({
      description: t.description,
      amount: t.amount,
      date: t.date || new Date().toISOString().split('T')[0],
      category: results[idx].category,
      confidence: results[idx].confidence,
    }));
  }
  
  // Only categorize what we need via AI
  const transactionsText = toCategorize
    .map((item, idx) => {
      const t = item.transaction;
      const dateStr = t.date ? `Date: ${t.date}` : '';
      return `${idx + 1}. Description: "${t.description}" | Amount: R${t.amount.toFixed(2)} ${dateStr}`;
    })
    .join('\n');

  const prompt = `You are a financial transaction categorizer. Categorize each transaction into ONE of these categories: ${VALID_CATEGORIES.join(', ')}.

Transactions to categorize:
${transactionsText}

For each transaction, respond with ONLY the category name from the list above. Return your response as a JSON array of objects, where each object has:
- "index": the transaction number (1-based)
- "category": the category name (must be one of: ${VALID_CATEGORIES.join(', ')})
- "confidence": a number between 0 and 1 indicating your confidence

Example response format:
[
  {"index": 1, "category": "groceries", "confidence": 0.95},
  {"index": 2, "category": "petrol", "confidence": 0.90}
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Budget Tracker',
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent categorization
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let categorizations: Array<{ index: number; category: string; confidence?: number }>;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      categorizations = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: try to extract categories from text response
      console.warn('Failed to parse JSON response, attempting fallback parsing', parseError);
      categorizations = fallbackParseCategories(content, transactions.length);
    }

    // After getting AI results, cache them:
    categorizations.forEach((cat) => {
      const item = toCategorize[cat.index - 1];
      if (item) {
        cacheCategory(item.transaction.description, cat.category, cat.confidence || 0.8);
      }
    });
    
    // Merge results
    toCategorize.forEach((item, idx) => {
      const cat = categorizations.find((c) => c.index === idx + 1);
      results[item.index] = {
        category: cat?.category || 'random',
        confidence: cat?.confidence || 0.5,
      };
    });

    // Map categorizations back to transactions
    const result: CategorizedTransaction[] = transactions.map((transaction, idx) => {
      const cat = categorizations.find((c) => c.index === idx + 1);
      const category = cat?.category || 'random';
      
      // Validate category
      const validCategory = VALID_CATEGORIES.includes(category) ? category : 'random';

      return {
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date || new Date().toISOString().split('T')[0],
        category: validCategory,
        confidence: cat?.confidence,
      };
    });

    return result;
  } catch (error) {
    console.error('Error categorizing transactions:', error);
    throw error;
  }
}

/**
 * Fallback parser if JSON parsing fails
 */
function fallbackParseCategories(
  content: string,
  expectedCount: number
): Array<{ index: number; category: string; confidence?: number }> {
  const result: Array<{ index: number; category: string; confidence?: number }> = [];
  
  // Try to find category names in the response
  const lines = content.split('\n');
  for (let i = 0; i < expectedCount; i++) {
    const line = lines[i] || '';
    // Look for any valid category in the line
    const foundCategory = VALID_CATEGORIES.find((cat) =>
      line.toLowerCase().includes(cat.toLowerCase())
    );
    
    result.push({
      index: i + 1,
      category: foundCategory || 'random',
      confidence: foundCategory ? 0.7 : 0.5,
    });
  }
  
  return result;
}

