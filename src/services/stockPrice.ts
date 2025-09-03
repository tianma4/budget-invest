// Stock Price Service for fetching real-time stock data
// Using Yahoo Finance API as a free alternative

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: number;
}

export interface StockPriceResponse {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
}

class StockPriceService {
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private cache = new Map<string, { data: StockQuote; expiry: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  async getStockPrice(symbol: string): Promise<StockQuote | null> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      const response = await fetch(`${this.baseUrl}/${symbol}?interval=1m&range=1d`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch stock price for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.chart?.result?.[0]) {
        console.warn(`No data found for symbol ${symbol}`);
        return null;
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (!meta || !quote) {
        console.warn(`Invalid data structure for symbol ${symbol}`);
        return null;
      }

      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const stockQuote: StockQuote = {
        symbol: symbol.toUpperCase(),
        price: Math.round(currentPrice * 100), // Convert to cents
        change: Math.round(change * 100), // Convert to cents
        changePercent: parseFloat(changePercent.toFixed(2)),
        lastUpdate: Date.now()
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

  async getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
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

  // Alternative method using a different API if Yahoo Finance fails
  async getStockPriceAlternative(symbol: string): Promise<StockQuote | null> {
    try {
      // Using Financial Modeling Prep API (free tier available)
      const apiKey = 'demo'; // Replace with actual API key for production
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${apiKey}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      const quote = data[0];
      const price = quote.price;
      const change = quote.change || 0;
      const changePercent = quote.changesPercentage || 0;

      return {
        symbol: symbol.toUpperCase(),
        price: Math.round(price * 100), // Convert to cents
        change: Math.round(change * 100), // Convert to cents
        changePercent: parseFloat(changePercent.toFixed(2)),
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching stock price from alternative API for ${symbol}:`, error);
      return null;
    }
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