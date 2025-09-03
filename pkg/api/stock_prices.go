package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/log"
)

// StockPricesApi represents stock prices api
type StockPricesApi struct{}

// Initialize a stock prices api singleton instance
var (
	StockPrices = &StockPricesApi{}
)

// StockQuoteRequest represents the stock quote request
type StockQuoteRequest struct {
	Symbol  string `json:"symbol" binding:"required,notBlank"`
	Symbols string `json:"symbols"` // Comma-separated symbols for multiple quotes
}

// StockQuoteResponse represents the stock quote response
type StockQuoteResponse struct {
	Symbol         string  `json:"symbol"`
	Price          int64   `json:"price"`          // Price in cents
	Change         int64   `json:"change"`         // Change in cents
	ChangePercent  float64 `json:"changePercent"`
	LastUpdate     int64   `json:"lastUpdate"`
	IsValid        bool    `json:"isValid"`
}

// MultiStockQuoteResponse represents multiple stock quotes response
type MultiStockQuoteResponse struct {
	Quotes map[string]StockQuoteResponse `json:"quotes"`
	Count  int                          `json:"count"`
}

// YahooFinanceQuoteResult represents Yahoo Finance API response structure
type YahooFinanceQuoteResult struct {
	Chart struct {
		Result []struct {
			Meta struct {
				RegularMarketPrice float64 `json:"regularMarketPrice"`
				PreviousClose      float64 `json:"previousClose"`
			} `json:"meta"`
		} `json:"result"`
	} `json:"chart"`
}

// StockQuoteHandler handles single stock quote requests
func (a *StockPricesApi) StockQuoteHandler(c *core.WebContext) (any, *errs.Error) {
	var stockQuoteRequest StockQuoteRequest
	err := c.ShouldBindJSON(&stockQuoteRequest)
	if err != nil {
		log.Warnf(c, "[stock_prices.StockQuoteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	symbol := strings.ToUpper(strings.TrimSpace(stockQuoteRequest.Symbol))
	if symbol == "" {
		return nil, errs.ErrSymbolIsRequired
	}

	quote, fetchErr := a.fetchStockQuote(c, symbol)
	if fetchErr != nil {
		return nil, fetchErr
	}

	return quote, nil
}

// MultiStockQuoteHandler handles multiple stock quote requests
func (a *StockPricesApi) MultiStockQuoteHandler(c *core.WebContext) (any, *errs.Error) {
	var stockQuoteRequest StockQuoteRequest
	err := c.ShouldBindJSON(&stockQuoteRequest)
	if err != nil {
		log.Warnf(c, "[stock_prices.MultiStockQuoteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	symbols := strings.Split(stockQuoteRequest.Symbols, ",")
	if len(symbols) == 0 {
		return nil, errs.ErrSymbolsRequired
	}

	response := MultiStockQuoteResponse{
		Quotes: make(map[string]StockQuoteResponse),
		Count:  0,
	}

	for _, symbol := range symbols {
		symbol = strings.ToUpper(strings.TrimSpace(symbol))
		if symbol == "" {
			continue
		}

		quote, fetchErr := a.fetchStockQuote(c, symbol)
		if fetchErr == nil && quote.IsValid {
			response.Quotes[symbol] = *quote
			response.Count++
		} else {
			// Add invalid quote for failed symbols
			response.Quotes[symbol] = StockQuoteResponse{
				Symbol:         symbol,
				Price:          0,
				Change:         0,
				ChangePercent:  0,
				LastUpdate:     time.Now().UnixMilli(),
				IsValid:        false,
			}
		}
	}

	return response, nil
}

// fetchStockQuote fetches stock quote from Yahoo Finance API
func (a *StockPricesApi) fetchStockQuote(c *core.WebContext, symbol string) (*StockQuoteResponse, *errs.Error) {
	// Use Yahoo Finance API with server-side request to avoid CORS issues
	url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1m&range=1d", symbol)
	
	log.Debugf(c, "[stock_prices.fetchStockQuote] Fetching stock quote for %s", symbol)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Failed to create request for %s: %s", symbol, err.Error())
		return nil, errs.ErrStockQuoteFetchFailed
	}

	// Set user agent to avoid blocking
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; ezBookkeeping-StockPriceProxy/1.0)")

	// Make request
	resp, err := client.Do(req)
	if err != nil {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Failed to fetch stock quote for %s: %s", symbol, err.Error())
		return nil, errs.ErrStockQuoteFetchFailed
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Yahoo Finance API returned status %d for %s", resp.StatusCode, symbol)
		return nil, errs.ErrStockQuoteFetchFailed
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Failed to read response body for %s: %s", symbol, err.Error())
		return nil, errs.ErrStockQuoteFetchFailed
	}

	// Parse JSON response
	var yahooResponse YahooFinanceQuoteResult
	err = json.Unmarshal(body, &yahooResponse)
	if err != nil {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Failed to parse JSON response for %s: %s", symbol, err.Error())
		return nil, errs.ErrStockQuoteFetchFailed
	}

	// Validate response structure
	if len(yahooResponse.Chart.Result) == 0 {
		log.Warnf(c, "[stock_prices.fetchStockQuote] No data found for symbol %s", symbol)
		return nil, errs.ErrStockQuoteNotFound
	}

	meta := yahooResponse.Chart.Result[0].Meta
	currentPrice := meta.RegularMarketPrice
	previousClose := meta.PreviousClose

	if currentPrice == 0 && previousClose != 0 {
		currentPrice = previousClose
	}

	if currentPrice == 0 {
		log.Warnf(c, "[stock_prices.fetchStockQuote] Invalid price data for symbol %s", symbol)
		return nil, errs.ErrStockQuoteNotFound
	}

	// Calculate changes
	change := currentPrice - previousClose
	changePercent := float64(0)
	if previousClose != 0 {
		changePercent = (change / previousClose) * 100
	}

	quote := &StockQuoteResponse{
		Symbol:         symbol,
		Price:          int64(currentPrice * 100), // Convert to cents
		Change:         int64(change * 100),       // Convert to cents
		ChangePercent:  changePercent,
		LastUpdate:     time.Now().UnixMilli(),
		IsValid:        true,
	}

	log.Debugf(c, "[stock_prices.fetchStockQuote] Successfully fetched quote for %s: $%.2f (%.2f%%)", 
		symbol, currentPrice, changePercent)

	return quote, nil
}