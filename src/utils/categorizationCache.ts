/**
 * Categorization cache for transaction descriptions
 * Uses localStorage to persist cache across sessions
 */

const CACHE_KEY = 'transaction_category_cache';
const CACHE_EXPIRY_DAYS = 30;

interface CachedCategory {
  category: string;
  confidence: number;
  timestamp: number;
}

interface CategoryCache {
  [description: string]: CachedCategory;
}

/**
 * Get cached category for a transaction description
 */
export function getCachedCategory(description: string): string | undefined {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return undefined;

    const cache: CategoryCache = JSON.parse(cacheStr);
    const normalizedDesc = normalizeDescription(description);
    const cached = cache[normalizedDesc];

    if (!cached) return undefined;

    // Check if cache is expired
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (now - cached.timestamp > expiryTime) {
      // Remove expired entry
      delete cache[normalizedDesc];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return undefined;
    }

    return cached.category;
  } catch (error) {
    console.warn('Error reading category cache:', error);
    return undefined;
  }
}

/**
 * Cache a category for a transaction description
 */
export function cacheCategory(description: string, category: string, confidence: number): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache: CategoryCache = cacheStr ? JSON.parse(cacheStr) : {};

    const normalizedDesc = normalizeDescription(description);
    cache[normalizedDesc] = {
      category,
      confidence,
      timestamp: Date.now(),
    };

    // Limit cache size to prevent localStorage bloat (keep last 1000 entries)
    const entries = Object.entries(cache);
    if (entries.length > 1000) {
      // Sort by timestamp and keep most recent 1000
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const limitedCache: CategoryCache = {};
      entries.slice(0, 1000).forEach(([key, value]) => {
        limitedCache[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(limitedCache));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.warn('Error caching category:', error);
  }
}

/**
 * Rule-based category matching for common transaction patterns
 * Returns category if matched, undefined otherwise
 */
export function getRuleBasedCategory(description: string): string | undefined {
  const normalized = normalizeDescription(description);

  // Groceries
  const groceryPatterns = [
    /checkers/i,
    /pick[_\s]?n[_\s]?pay/i,
    /woolworths/i,
    /spar/i,
    /shoprite/i,
    /food lovers/i,
    /dischem/i,
    /clicks/i,
    /pharmacy/i,
    /supermarket/i,
    /grocery/i,
  ];
  if (groceryPatterns.some((pattern) => pattern.test(normalized))) {
    return 'groceries';
  }

  // Petrol
  const petrolPatterns = [
    /engen/i,
    /shell/i,
    /bp/i,
    /sasol/i,
    /caltex/i,
    /total/i,
    /petrol/i,
    /fuel/i,
    /gas station/i,
    /filling station/i,
  ];
  if (petrolPatterns.some((pattern) => pattern.test(normalized))) {
    return 'petrol';
  }

  // Eating Out
  const eatingOutPatterns = [
    /restaurant/i,
    /mcdonald/i,
    /kfc/i,
    /nandos/i,
    /steers/i,
    /debonairs/i,
    /pizza/i,
    /coffee/i,
    /cafe/i,
    /takeaway/i,
    /take[_\s]?away/i,
    /uber[_\s]?eats/i,
    /mr[_\s]?d[_\s]?food/i,
  ];
  if (eatingOutPatterns.some((pattern) => pattern.test(normalized))) {
    return 'eatingOut';
  }

  // Entertainment
  const entertainmentPatterns = [
    /netflix/i,
    /spotify/i,
    /disney/i,
    /showmax/i,
    /movie/i,
    /cinema/i,
    /theatre/i,
    /game/i,
    /playstation/i,
    /xbox/i,
  ];
  if (entertainmentPatterns.some((pattern) => pattern.test(normalized))) {
    return 'entertainment';
  }

  // Rent
  const rentPatterns = [
    /rent/i,
    /landlord/i,
    /property/i,
    /housing/i,
  ];
  if (rentPatterns.some((pattern) => pattern.test(normalized))) {
    return 'rent';
  }

  // Electricity
  const electricityPatterns = [
    /eskom/i,
    /electricity/i,
    /power/i,
    /prepaid/i,
  ];
  if (electricityPatterns.some((pattern) => pattern.test(normalized))) {
    return 'electricity';
  }

  // Water
  const waterPatterns = [
    /water/i,
    /municipality/i,
    /city[_\s]?of/i,
  ];
  if (waterPatterns.some((pattern) => pattern.test(normalized))) {
    return 'water';
  }

  // Medical Aid
  const medicalPatterns = [
    /medical[_\s]?aid/i,
    /discovery/i,
    /bonitas/i,
    /momentum/i,
    /hospital/i,
    /doctor/i,
    /clinic/i,
  ];
  if (medicalPatterns.some((pattern) => pattern.test(normalized))) {
    return 'medicalAid';
  }

  // Gym
  const gymPatterns = [
    /gym/i,
    /virgin[_\s]?active/i,
    /planet[_\s]?fitness/i,
    /fitness/i,
  ];
  if (gymPatterns.some((pattern) => pattern.test(normalized))) {
    return 'gym';
  }

  // Internet
  const internetPatterns = [
    /vodacom/i,
    /mtn/i,
    /cell[_\s]?c/i,
    /telkom/i,
    /afrihost/i,
    /webafrica/i,
    /internet/i,
    /fibre/i,
    /broadband/i,
  ];
  if (internetPatterns.some((pattern) => pattern.test(normalized))) {
    return 'internet';
  }

  return undefined;
}

/**
 * Normalize description for consistent caching
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, ''); // Remove special characters for better matching
}
