package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/log"
	"github.com/mayswind/ezbookkeeping/pkg/models"
)

// StockPriceService represents stock price service
type StockPriceService struct {
	ServiceUsingDB
	container *datastore.DataStoreContainer
}

// AlphaVantageQuoteResponse represents Alpha Vantage API response for quote
type AlphaVantageQuoteResponse struct {
	GlobalQuote GlobalQuote `json:"Global Quote"`
}

// GlobalQuote represents the quote data from Alpha Vantage
type GlobalQuote struct {
	Symbol           string `json:"01. symbol"`
	Open             string `json:"02. open"`
	High             string `json:"03. high"`
	Low              string `json:"04. low"`
	Price            string `json:"05. price"`
	Volume           string `json:"06. volume"`
	LatestTradingDay string `json:"07. latest trading day"`
	PreviousClose    string `json:"08. previous close"`
	Change           string `json:"09. change"`
	ChangePercent    string `json:"10. change percent"`
}

// YahooFinanceResponse represents Yahoo Finance API response
type YahooFinanceResponse struct {
	QuoteResponse struct {
		Result []struct {
			Symbol             string  `json:"symbol"`
			RegularMarketPrice float64 `json:"regularMarketPrice"`
			ShortName          string  `json:"shortName"`
			Currency           string  `json:"currency"`
		} `json:"result"`
	} `json:"quoteResponse"`
}

// GetStockPrice returns current stock price for a ticker symbol
func (s *StockPriceService) GetStockPrice(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	if tickerSymbol == "" {
		return nil, errs.ErrTickerSymbolIsEmpty
	}

	// First check cache
	stockPrice, err := s.getStockPriceFromCache(c, tickerSymbol)
	if err == nil && stockPrice != nil {
		// Check if cache is still fresh (less than 1 hour old)
		if time.Now().Unix()-stockPrice.LastUpdatedTime < 3600 {
			return stockPrice, nil
		}
	}

	// Cache miss or stale, fetch from API
	stockPrice, err = s.fetchStockPriceFromAPI(c, tickerSymbol)
	if err != nil {
		log.Warnf(c, "[stock_prices.GetStockPrice] failed to fetch stock price for %s from API, error %s", tickerSymbol, err.Error())
		// If API fails, return cached data even if stale
		if stockPrice != nil {
			return stockPrice, nil
		}
		return nil, err
	}

	// Save to cache
	err = s.saveStockPriceToCache(c, stockPrice)
	if err != nil {
		log.Warnf(c, "[stock_prices.GetStockPrice] failed to save stock price to cache, error %s", err.Error())
	}

	return stockPrice, nil
}

// GetMultipleStockPrices returns stock prices for multiple ticker symbols
func (s *StockPriceService) GetMultipleStockPrices(c core.Context, tickerSymbols []string) (map[string]*models.StockPrice, error) {
	results := make(map[string]*models.StockPrice)

	for _, symbol := range tickerSymbols {
		if symbol == "" {
			continue
		}

		stockPrice, err := s.GetStockPrice(c, symbol)
		if err != nil {
			log.Warnf(c, "[stock_prices.GetMultipleStockPrices] failed to get stock price for %s, error %s", symbol, err.Error())
			continue
		}

		results[symbol] = stockPrice
	}

	return results, nil
}

// RefreshStockPriceCache refreshes the cache for a ticker symbol by forcing API fetch
func (s *StockPriceService) RefreshStockPriceCache(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	stockPrice, err := s.fetchStockPriceFromAPI(c, tickerSymbol)
	if err != nil {
		return nil, err
	}

	err = s.saveStockPriceToCache(c, stockPrice)
	if err != nil {
		log.Warnf(c, "[stock_prices.RefreshStockPriceCache] failed to save stock price to cache, error %s", err.Error())
	}

	return stockPrice, nil
}

// getStockPriceFromCache retrieves stock price from database cache
func (s *StockPriceService) getStockPriceFromCache(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	sess := s.container.UserDataStore.Get(0).NewSession(c)
	defer sess.Close()

	var stockPrice models.StockPrice
	has, err := sess.Where("ticker_symbol=?", tickerSymbol).Get(&stockPrice)
	if err != nil {
		return nil, err
	}

	if !has {
		return nil, errs.ErrStockPriceNotFound
	}

	return &stockPrice, nil
}

// saveStockPriceToCache saves stock price to database cache
func (s *StockPriceService) saveStockPriceToCache(c core.Context, stockPrice *models.StockPrice) error {
	sess := s.container.UserDataStore.Get(0).NewSession(c)
	defer sess.Close()

	stockPrice.LastUpdatedTime = time.Now().Unix()

	// Use UPSERT logic
	existing := &models.StockPrice{}
	has, err := sess.Where("ticker_symbol=?", stockPrice.TickerSymbol).Get(existing)
	if err != nil {
		return err
	}

	if has {
		// Update existing record
		_, err = sess.Where("ticker_symbol=?", stockPrice.TickerSymbol).Update(stockPrice)
	} else {
		// Insert new record
		_, err = sess.Insert(stockPrice)
	}

	return err
}

// fetchStockPriceFromAPI fetches stock price from external API
func (s *StockPriceService) fetchStockPriceFromAPI(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	// Try Yahoo Finance first (free, no API key required)
	stockPrice, err := s.fetchFromYahooFinance(c, tickerSymbol)
	if err == nil {
		return stockPrice, nil
	}

	log.Warnf(c, "[stock_prices.fetchStockPriceFromAPI] Yahoo Finance API failed for %s, error %s", tickerSymbol, err.Error())

	// Fallback to Alpha Vantage if configured
	// Note: Alpha Vantage requires API key, so this is optional
	return s.fetchFromAlphaVantage(c, tickerSymbol)
}

// fetchFromYahooFinance fetches stock price from Yahoo Finance API
func (s *StockPriceService) fetchFromYahooFinance(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s", tickerSymbol)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Yahoo Finance API returned status %d", resp.StatusCode)
	}

	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return nil, err
	}

	// Parse Yahoo Finance response
	chart, ok := data["chart"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format from Yahoo Finance")
	}

	results, ok := chart["result"].([]interface{})
	if !ok || len(results) == 0 {
		return nil, fmt.Errorf("no results in Yahoo Finance response")
	}

	result := results[0].(map[string]interface{})
	meta, ok := result["meta"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("no meta data in Yahoo Finance response")
	}

	// Extract price and currency
	regularMarketPrice, ok := meta["regularMarketPrice"].(float64)
	if !ok {
		return nil, fmt.Errorf("no regular market price in response")
	}

	currency, ok := meta["currency"].(string)
	if !ok {
		currency = "USD" // Default to USD if not specified
	}

	symbol, ok := meta["symbol"].(string)
	if !ok {
		symbol = tickerSymbol
	}

	// Convert price to cents for storage
	priceInCents := int64(regularMarketPrice * 100)

	stockPrice := &models.StockPrice{
		TickerSymbol:    symbol,
		CompanyName:     "", // Yahoo doesn't provide company name in this endpoint
		CurrentPrice:    priceInCents,
		Currency:        currency,
		LastUpdatedTime: time.Now().Unix(),
	}

	return stockPrice, nil
}

// fetchFromAlphaVantage fetches stock price from Alpha Vantage API
func (s *StockPriceService) fetchFromAlphaVantage(c core.Context, tickerSymbol string) (*models.StockPrice, error) {
	// This would require an API key, so for now return an error
	// Users can implement this if they have an Alpha Vantage API key
	return nil, fmt.Errorf("Alpha Vantage API not configured")
}

// convertPriceToFloat64 converts price in cents to float64
func (s *StockPriceService) convertPriceToFloat64(priceInCents int64) float64 {
	return float64(priceInCents) / 100.0
}

// convertPriceFromFloat64 converts float64 price to cents
func (s *StockPriceService) convertPriceFromFloat64(price float64) int64 {
	return int64(price * 100)
}

// NewStockPriceService returns new stock price service
func NewStockPriceService(container *datastore.DataStoreContainer) *StockPriceService {
	return &StockPriceService{
		ServiceUsingDB: ServiceUsingDB{
			container: container,
		},
		container: container,
	}
}