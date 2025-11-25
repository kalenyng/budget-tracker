// Dynamic import for pdfjs-dist to avoid SSR issues
let pdfjsLib: any;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configure PDF.js worker for Vite - use local worker
    if (typeof window !== 'undefined') {
      // Try using import.meta.url with a relative path to node_modules
      // Fallback to public folder if that doesn't work
      try {
        const workerUrl = new URL(
          '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
      } catch {
        // Fallback to public folder worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }
    }
  }
  return pdfjsLib;
}

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
 * Extract text from PDF file
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Better text extraction - preserve line breaks and spacing
    let pageText = '';
    let lastY = 0;
    
    for (const item of textContent.items) {
      const itemAny = item as any;
      const currentY = itemAny.transform?.[5] || 0; // Y position
      
      // If Y position changed significantly, it's a new line
      if (Math.abs(currentY - lastY) > 5 && lastY > 0) {
        pageText += '\n';
      } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
        // Add space between words on same line
        pageText += ' ';
      }
      
      pageText += itemAny.str || '';
      lastY = currentY;
    }
    
    fullText += pageText + '\n\n';
  }
  
  console.log(`📄 Extracted text from ${pdf.numPages} page(s), total length: ${fullText.length}`);
  return fullText;
}

/**
 * Use AI to extract transactions from PDF text
 */
async function extractTransactionsWithAI(pdfText: string): Promise<ParsedTransaction[]> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  console.log('🔑 API Key configured:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Process in chunks if text is too long (many models have token limits)
  const maxChunkSize = 12000; // Increased from 8000
  const chunks: string[] = [];
  
  console.log(`📄 Processing PDF text (${pdfText.length} characters)...`);
  
  if (pdfText.length > maxChunkSize) {
    console.log(`📦 PDF text exceeds ${maxChunkSize} chars, splitting into chunks...`);
    // Split by pages or lines to preserve transaction context
    const lines = pdfText.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    console.log(`✅ Split into ${chunks.length} chunks`);
  } else {
    chunks.push(pdfText);
    console.log('✅ PDF text fits in single chunk');
  }

  const allTransactions: ParsedTransaction[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;
    
    console.log(`\n🔄 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} characters)...`);
    console.log(`📝 Chunk preview: ${chunk.substring(0, 200)}...`);
    
    const prompt = `You are a financial data extraction expert. Extract ALL financial transactions from this bank statement text.

IMPORTANT INSTRUCTIONS:
1. Look for transaction rows that contain: dates, descriptions/merchant names, and amounts
2. Extract debit/expense transactions (money going out)
3. Ignore credits, deposits, or balance information unless they are expenses
4. Amounts should be positive numbers (expenses)
5. Dates should be converted to YYYY-MM-DD format
6. Extract the full merchant/description text

Bank statement text (${isLastChunk ? 'final' : `part ${i + 1} of ${chunks.length}`}):
${chunk}

Return ONLY a valid JSON array of transactions. Each transaction must have:
- "date": string in YYYY-MM-DD format
- "description": string (merchant name or transaction description)
- "amount": number (positive, expenses only)
- "reference": string (optional, transaction ID or reference number if available)

Example format:
[
  {"date": "2024-01-15", "description": "GROCERY STORE ABC", "amount": 250.50, "reference": "TXN123456"},
  {"date": "2024-01-16", "description": "PETROL STATION XYZ", "amount": 500.00}
]

Return ONLY the JSON array, no explanations, no markdown, just the array.`;

    try {
      const startTime = Date.now();
      console.log(`🚀 Sending request to OpenRouter API (chunk ${i + 1}/${chunks.length})...`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutMs = 90000; // 90 second timeout
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ Request timeout after ${timeoutMs / 1000} seconds`);
        controller.abort();
      }, timeoutMs);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Budget Tracker',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a financial data extraction expert. Extract transaction data from bank statements and return only valid JSON arrays.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal, // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request succeeds
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ API response received in ${elapsedTime}s (status: ${response.status})`);

      console.log('📦 Parsing API response...');
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log('📋 Response headers:', {
        contentType: contentType || 'not set',
        contentLength: contentLength || 'not set',
      });
      
      // Read response body first, then check for errors
      let data: any;
      try {
        console.log('🔄 Reading response body...');
        
        // Read response directly
        data = await response.json();
        console.log('✅ Successfully parsed response as JSON');
        
        // Check for API errors in response
        if (data.error) {
          console.error('❌ API Error in response:', data.error);
          const errorMsg = data.error.message || 'Unknown API error';
          const errorCode = data.error.code || response.status;
          
          // Handle rate limiting gracefully
          if (errorCode === 429 || response.status === 429) {
            console.warn('⚠️ Rate limit hit - falling back to pattern matching');
            throw new Error('RATE_LIMIT'); // Special error code for rate limits
          }
          
          throw new Error(`AI extraction failed: ${errorMsg}`);
        }
        
        if (!response.ok) {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
          });
          
          // Handle rate limiting
          if (response.status === 429) {
            console.warn('⚠️ Rate limit hit - falling back to pattern matching');
            throw new Error('RATE_LIMIT');
          }
          
          throw new Error(`AI extraction failed: ${response.status} ${data.error?.message || response.statusText}`);
        }
        
        console.log('✅ Successfully parsed response as JSON');
        console.log('📊 Response keys:', Object.keys(data));
        console.log('📊 Response structure:', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          hasError: !!data.error,
          errorMessage: data.error?.message || null,
        });
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        
        // Check if it's a rate limit error
        if (parseError instanceof Error && (parseError.message.includes('429') || parseError.message.includes('RATE_LIMIT'))) {
          throw new Error('RATE_LIMIT');
        }
        
        // Try to read as text for debugging (only if response hasn't been consumed)
        // Note: We can't clone after reading, so we skip this if we already tried to read
        if (!response.bodyUsed) {
          try {
            const clonedResponse2 = response.clone();
            const textPromise = clonedResponse2.text();
            const textTimeout = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Text reading timeout')), 5000)
            );
            const responseText = await Promise.race([textPromise, textTimeout]) as string;
            console.error('📄 Raw response text length:', responseText.length);
            console.error('📄 Raw response (first 1000 chars):', responseText.substring(0, 1000));
          } catch (textError) {
            console.error('❌ Could not read response as text:', textError);
          }
        }
        throw new Error(`Invalid JSON response from API: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('API response does not contain choices array');
      }
      
      let content = data.choices[0]?.message?.content || '';
      console.log(`📊 Response content length: ${content.length} characters`);
      console.log(`👀 Response content preview: ${content.substring(0, 300)}...`);

      // Try to extract JSON array from response
      let transactions: any[] = [];
      console.log('🔍 Attempting to extract JSON from response...');
      
      // First, try to find JSON array directly
      const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        console.log('✅ Found JSON array pattern in response');
        try {
          transactions = JSON.parse(jsonArrayMatch[0]);
          console.log(`✅ Successfully parsed JSON array with ${transactions.length} items`);
        } catch (e) {
          console.warn('⚠️ Failed to parse JSON array, trying alternative parsing', e);
        }
      } else {
        console.log('⚠️ No JSON array pattern found, trying direct JSON parse...');
      }
      
      // If that didn't work, try to find JSON object with transactions array
      if (transactions.length === 0) {
        try {
          const jsonObject = JSON.parse(content);
          if (Array.isArray(jsonObject)) {
            transactions = jsonObject;
            console.log(`✅ Parsed as direct array with ${transactions.length} items`);
          } else if (jsonObject.transactions && Array.isArray(jsonObject.transactions)) {
            transactions = jsonObject.transactions;
            console.log(`✅ Found transactions array in object with ${transactions.length} items`);
          } else {
            console.warn('⚠️ JSON object does not contain transactions array', jsonObject);
          }
        } catch (e) {
          console.error('❌ Failed to parse as JSON object:', e);
          console.log('Raw content that failed to parse:', content.substring(0, 500));
        }
      }

      if (transactions.length === 0) {
        console.warn('⚠️ No transactions extracted from this chunk');
      } else {
        console.log(`📋 Extracted ${transactions.length} raw transactions from chunk ${i + 1}`);
      }

      // Process and validate transactions
      console.log('🔧 Processing and validating transactions...');
      const validTransactions = transactions
        .map((t: any) => {
          // Parse date
          let date = t.date || '';
          if (date) {
            // Try to parse various date formats
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              date = dateObj.toISOString().split('T')[0];
            } else {
              // Try common formats
              const dateMatch = date.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              if (dateMatch) {
                const [, d, m, y] = dateMatch;
                const year = y.length === 2 ? `20${y}` : y;
                date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              } else {
                date = new Date().toISOString().split('T')[0];
              }
            }
          } else {
            date = new Date().toISOString().split('T')[0];
          }

          return {
            date,
            description: (t.description || t.merchant || t.details || '').trim(),
            amount: Math.abs(parseFloat(t.amount) || 0),
            reference: t.reference || t.ref || t.transactionId || undefined,
          };
        })
        .filter((t: ParsedTransaction) => t.amount > 0 && t.description.length > 0);

      console.log(`✅ Validated ${validTransactions.length} transactions from chunk ${i + 1}`);
      allTransactions.push(...validTransactions);
    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('⏱️ Request was aborted (timeout)');
          throw new Error('AI extraction timed out after 90 seconds. The PDF may be too large or the API is slow. Try a smaller file or check your internet connection.');
        }
        console.error('📋 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500),
        });
      }
      
      // Continue with next chunk even if one fails
      if (i === 0) {
        throw error; // Only throw if first chunk fails
      } else {
        console.warn(`⚠️ Continuing with remaining chunks despite error in chunk ${i + 1}`);
      }
    }
  }

  console.log(`\n📊 Total transactions extracted from all chunks: ${allTransactions.length}`);

  // Remove duplicates based on date + description + amount
  console.log('🔍 Removing duplicate transactions...');
  const uniqueTransactions = allTransactions.filter((t, index, self) =>
    index === self.findIndex((tt) =>
      tt.date === t.date &&
      tt.description === t.description &&
      Math.abs(tt.amount - t.amount) < 0.01
    )
  );

  const duplicatesRemoved = allTransactions.length - uniqueTransactions.length;
  if (duplicatesRemoved > 0) {
    console.log(`✅ Removed ${duplicatesRemoved} duplicate transactions`);
  }
  console.log(`✅ Final unique transactions: ${uniqueTransactions.length}`);

  return uniqueTransactions;
}

/**
 * Fallback: Try to extract transactions using pattern matching
 */
function extractTransactionsPatternMatching(pdfText: string): ParsedTransaction[] {
  console.log('🔍 Starting pattern matching extraction...');
  const transactions: ParsedTransaction[] = [];
  
  // Split by lines and also by common separators - be more aggressive
  // Also split by multiple spaces which might indicate columns
  const lines = pdfText
    .split(/\n|\r\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3);
  
  // Also try splitting by multiple spaces (columnar data)
  const allLines: string[] = [];
  for (const line of lines) {
    // If line has multiple spaces, it might be columnar - split and keep both
    if (line.match(/\s{3,}/)) {
      // Keep original line
      allLines.push(line);
      // Also split by multiple spaces and add parts
      const parts = line.split(/\s{3,}/);
      allLines.push(...parts.map(p => p.trim()).filter(p => p.length > 3));
    } else {
      allLines.push(line);
    }
  }
  
  console.log(`📄 Analyzing ${allLines.length} lines for transactions (from ${lines.length} original lines)...`);

  // Enhanced patterns for bank statements
  // Date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, YYYY-MM-DD, DD.MM.YYYY
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g, // YYYY/MM/DD or YYYY-MM-DD
  ];
  
  // Enhanced amount patterns: R1,234.56, -R500.00, 1234.56, R 1 234.56, etc.
  const amountPatterns = [
    /[R$]?\s*([-]?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/g, // Standard format
    /([-]?\d+\.\d{2})/g, // Decimal format
    /[R$]?\s*([-]?\d{1,3}(?:\s\d{3})*)/g, // Space-separated thousands
  ];

  // Look for transaction patterns across multiple lines
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const nextLine = i < allLines.length - 1 ? allLines[i + 1] : '';
    const prevLine = i > 0 ? allLines[i - 1] : '';
    const combinedLine = prevLine + ' ' + line + ' ' + nextLine; // Check surrounding lines
    
    // Try each date pattern
    for (const datePattern of datePatterns) {
      const dateMatches = [...line.matchAll(datePattern)];
      
      for (const dateMatch of dateMatches) {
        const dateStr = dateMatch[1];
        
        // Try each amount pattern
        for (const amountPattern of amountPatterns) {
          const amountMatches = [...combinedLine.matchAll(amountPattern)];
          
          for (const amountMatch of amountMatches) {
            const amountStr = amountMatch[1].replace(/[,\s]/g, '').replace(/[R$]/g, '');
            const amount = parseFloat(amountStr);

            // Only process if amount is reasonable (between 0.01 and 1,000,000)
            if (amount > 0.01 && amount < 1000000) {
              // Extract description - look for text near the date/amount
              let description = '';
              
              // Try to find description on the same line or nearby
              const lineParts = line.split(/\s+/);
              const descriptionParts: string[] = [];
              
              for (const part of lineParts) {
                // Skip if it's a date, amount, or very short
                if (!datePattern.test(part) && 
                    !amountPattern.test(part) && 
                    part.length > 2 &&
                    !/^\d+$/.test(part) && // Skip pure numbers
                    !/^[A-Z]{2,4}\d+$/.test(part)) { // Skip codes like "DDA13", "FN090"
                  descriptionParts.push(part);
                }
              }
              
              description = descriptionParts.join(' ').trim().substring(0, 150);
              
              // If no description found, try next line
              if (!description || description.length < 3) {
                const nextLineParts = nextLine.split(/\s+/);
                const nextDescriptionParts = nextLineParts.filter(
                  (p) => p.length > 2 && !datePattern.test(p) && !amountPattern.test(p)
                );
                description = nextDescriptionParts.join(' ').trim().substring(0, 150);
              }
              
              // Default description if still empty
              if (!description || description.length < 3) {
                description = 'Transaction';
              }

              // Parse date
              let date = new Date().toISOString().split('T')[0];
              try {
                const parts = dateStr.split(/[\/\-\.]/);
                if (parts.length === 3) {
                  let d: string, m: string, y: string;
                  
                  // Determine format based on first part length
                  if (parts[0].length === 4) {
                    // YYYY/MM/DD format
                    [y, m, d] = parts;
                  } else {
                    // DD/MM/YYYY format
                    [d, m, y] = parts;
                  }
                  
                  const year = y.length === 2 ? `20${y}` : y;
                  date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  
                  // Validate date
                  const dateObj = new Date(date);
                  if (isNaN(dateObj.getTime())) {
                    date = new Date().toISOString().split('T')[0];
                  }
                }
              } catch {
                // Use current date if parsing fails
              }

              transactions.push({
                date,
                description,
                amount: Math.abs(amount),
              });
              
              // Break after finding first valid transaction on this line
              break;
            }
          }
          if (transactions.length > 0 && transactions[transactions.length - 1].description !== 'Transaction') {
            break;
          }
        }
        if (transactions.length > 0 && transactions[transactions.length - 1].description !== 'Transaction') {
          break;
        }
      }
    }
  }

  // Remove duplicates
  const uniqueTransactions = transactions.filter((t, index, self) =>
    index === self.findIndex((tt) =>
      tt.date === t.date &&
      Math.abs(tt.amount - t.amount) < 0.01 &&
      (tt.description === t.description || 
       (tt.description.length > 10 && t.description.length > 10 && 
        tt.description.substring(0, 10) === t.description.substring(0, 10)))
    )
  );

  console.log(`✅ Pattern matching found ${uniqueTransactions.length} unique transactions`);
  return uniqueTransactions;
}

/**
 * Parse PDF file and extract transactions
 */
export async function parsePdfFile(
  file: File,
  useAI: boolean = true
): Promise<ParseResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  try {
    // Extract text from PDF
    const pdfText = await extractTextFromPdf(file);

    if (!pdfText || pdfText.trim().length === 0) {
      errors.push('Could not extract text from PDF. The PDF may be image-based or corrupted.');
      return { transactions, errors };
    }

    console.log('\n📄 ========== PDF PARSING STARTED ==========');
    console.log(`📏 Extracted PDF text length: ${pdfText.length} characters`);
    console.log(`👀 First 500 chars preview:\n${pdfText.substring(0, 500)}...\n`);

    // Always try AI extraction first if API key is available
    if (useAI && import.meta.env.VITE_OPENROUTER_API_KEY) {
      try {
        console.log('🤖 Attempting AI extraction...');
        const aiTransactions = await extractTransactionsWithAI(pdfText);
        console.log(`\n✅ AI extraction complete! Found ${aiTransactions.length} transactions`);

        if (aiTransactions.length > 0) {
          return { transactions: aiTransactions, errors: [] };
        } else {
          console.warn('⚠️ AI extraction completed but found no transactions');
          errors.push('AI extraction completed but found no transactions. The statement format may not be recognized.');
        }
      } catch (aiError) {
        console.error('\n❌ AI extraction error:', aiError);
        if (aiError instanceof Error) {
          console.error('Error message:', aiError.message);
          console.error('Error stack:', aiError.stack?.substring(0, 500));
          
          // Don't add error for rate limits - it's expected
          if (aiError.message.includes('RATE_LIMIT') || aiError.message.includes('429')) {
            console.warn('⚠️ Rate limit reached - using pattern matching fallback');
            errors.push('AI rate limit reached. Using pattern matching instead.');
          } else {
            errors.push(`AI extraction failed: ${aiError.message}. Trying pattern matching...`);
          }
        } else {
          errors.push(`AI extraction failed: Unknown error. Trying pattern matching...`);
        }
      }
    } else if (useAI) {
      console.warn('⚠️ OpenRouter API key not configured. AI extraction unavailable.');
      errors.push('OpenRouter API key not configured. AI extraction unavailable. Using pattern matching...');
    }

    // Fallback to pattern matching
    console.log('\n🔍 Attempting pattern matching fallback...');
    const patternTransactions = extractTransactionsPatternMatching(pdfText);
    console.log(`📊 Pattern matching found ${patternTransactions.length} transactions`);
    
    if (patternTransactions.length === 0) {
      errors.push('No transactions found in PDF. The statement format may not be supported. Please ensure your bank statement contains transaction data with dates and amounts.');
    }

    console.log(`\n✅ ========== PDF PARSING COMPLETE ==========`);
    console.log(`📊 Total transactions: ${patternTransactions.length}`);
    console.log(`⚠️ Errors: ${errors.length}`);
    
    return {
      transactions: patternTransactions,
      errors: errors.length > 0 ? errors : [],
    };
  } catch (error) {
    console.error('\n❌ ========== PDF PARSING FAILED ==========');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      transactions: [],
      errors: [`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

