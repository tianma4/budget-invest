// Stock Price Service for fetching real-time stock data
// Using Yahoo Finance API as a free alternative

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: number;
  isValid?: boolean;
}

export interface StockPriceResponse {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
}

class StockPriceService {
  private cache = new Map<string, { data: StockQuote; expiry: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  async getStockPrice(symbol: string): Promise<StockQuote | null> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      // Use backend proxy endpoint instead of direct API calls
      const response = await fetch('/api/v1/stock_prices/quote.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase()
        })
      });
      
      if (!response.ok) {
        console.warn(`Backend stock price API failed for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        console.warn(`Invalid response from backend for ${symbol}`);
        return null;
      }

      const stockQuote: StockQuote = {
        symbol: data.data.symbol,
        price: data.data.price,
        change: data.data.change,
        changePercent: data.data.changePercent,
        lastUpdate: data.data.lastUpdate
      };

      // Cache the result
      this.cache.set(symbol, {
        data: stockQuote,
        expiry: Date.now() + this.cacheTimeout
      });

      return stockQuote;
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol}:`, error);
      return null;
    }
  }

  private getAuthToken(): string {
    // Get token from localStorage or store
    const token = localStorage.getItem('ezbookkeeping_token') || '';
    return token;
  }

  async getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    
    try {
      // Use backend bulk endpoint for efficiency
      const symbolsString = symbols.map(s => s.toUpperCase()).join(',');
      
      const response = await fetch('/api/v1/stock_prices/quotes.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          symbols: symbolsString
        })
      });
      
      if (!response.ok) {
        console.warn(`Backend bulk stock price API failed: ${response.status}`);
        // Fallback to individual requests
        return await this.fallbackToIndividualRequests(symbols);
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.quotes) {
        console.warn('Invalid bulk response from backend');
        return await this.fallbackToIndividualRequests(symbols);
      }

      // Convert backend response to Map
      Object.entries(data.data.quotes).forEach(([symbol, quote]) => {
        const stockQuote = quote as StockQuote;
        if (stockQuote.isValid) {
          results.set(symbol.toUpperCase(), stockQuote);
          // Cache individual results
          this.cache.set(symbol, {
            data: stockQuote,
            expiry: Date.now() + this.cacheTimeout
          });
        }
      });

    } catch (error) {
      console.error('Error fetching bulk stock prices:', error);
      return await this.fallbackToIndividualRequests(symbols);
    }

    return results;
  }

  private async fallbackToIndividualRequests(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getStockPrice(symbol));
      
      try {
        const batchResults = await Promise.all(promises);
        
        batchResults.forEach((quote, index) => {
          if (quote) {
            results.set(batch[index].toUpperCase(), quote);
          }
        });
        
        // Add small delay between batches to be respectful to the API
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error fetching batch of stock prices:', error);
      }
    }

    return results;
  }

  // Legacy alternative method - now handled by backend
  async getStockPriceAlternative(symbol: string): Promise<StockQuote | null> {
    console.warn('getStockPriceAlternative is deprecated, using backend proxy instead');
    return this.getStockPrice(symbol);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const stockPriceService = new StockPriceService();

// Utility function for formatting prices
export function formatStockPrice(priceInCents: number, currency: string = 'USD'): string {
  const price = priceInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

// Utility function for formatting price changes
export function formatPriceChange(changeInCents: number, changePercent: number): string {
  const change = changeInCents / 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}