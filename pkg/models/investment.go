package models

import (
	"github.com/mayswind/ezbookkeeping/pkg/errs"
)

// InvestmentTransactionType represents investment transaction type
type InvestmentTransactionType byte

// Investment transaction types
const (
	INVESTMENT_TRANSACTION_TYPE_BUY  InvestmentTransactionType = 1
	INVESTMENT_TRANSACTION_TYPE_SELL InvestmentTransactionType = 2
)

// Investment represents a stock/investment holding in database
type Investment struct {
	InvestmentId      int64   `xorm:"PK"`
	Uid               int64   `xorm:"INDEX(IDX_investment_uid_deleted) INDEX(IDX_investment_uid_deleted_ticker) NOT NULL"`
	Deleted           bool    `xorm:"INDEX(IDX_investment_uid_deleted) INDEX(IDX_investment_uid_deleted_ticker) NOT NULL"`
	TickerSymbol      string  `xorm:"VARCHAR(10) INDEX(IDX_investment_uid_deleted_ticker) NOT NULL"`
	CompanyName       string  `xorm:"VARCHAR(255)"`
	SharesOwned       float64 `xorm:"DECIMAL(12,4) NOT NULL"`
	AvgCostPerShare   int64   `xorm:"NOT NULL"` // Stored in cents
	TotalInvested     int64   `xorm:"NOT NULL"` // Stored in cents
	Currency          string  `xorm:"VARCHAR(3) NOT NULL"`
	CreatedUnixTime   int64
	UpdatedUnixTime   int64
	DeletedUnixTime   int64
}

// InvestmentTransaction represents an investment buy/sell transaction in database
type InvestmentTransaction struct {
	TransactionId     int64                     `xorm:"PK"`
	Uid               int64                     `xorm:"INDEX(IDX_inv_transaction_uid_deleted) INDEX(IDX_inv_transaction_uid_deleted_ticker) NOT NULL"`
	Deleted           bool                      `xorm:"INDEX(IDX_inv_transaction_uid_deleted) INDEX(IDX_inv_transaction_uid_deleted_ticker) NOT NULL"`
	TickerSymbol      string                    `xorm:"VARCHAR(10) INDEX(IDX_inv_transaction_uid_deleted_ticker) NOT NULL"`
	Type              InvestmentTransactionType `xorm:"NOT NULL"`
	Shares            float64                   `xorm:"DECIMAL(12,4) NOT NULL"`
	PricePerShare     int64                     `xorm:"NOT NULL"` // Stored in cents
	TotalAmount       int64                     `xorm:"NOT NULL"` // Stored in cents
	Fees              int64                     `xorm:"NOT NULL"` // Stored in cents
	Currency          string                    `xorm:"VARCHAR(3) NOT NULL"`
	TransactionTime   int64                     `xorm:"INDEX(IDX_inv_transaction_uid_deleted_time) NOT NULL"`
	TimezoneUtcOffset int16                     `xorm:"NOT NULL"`
	Comment           string                    `xorm:"VARCHAR(255) NOT NULL"`
	CreatedUnixTime   int64
	UpdatedUnixTime   int64
	DeletedUnixTime   int64
}

// StockPrice represents current stock price cache in database
type StockPrice struct {
	TickerSymbol    string `xorm:"PK VARCHAR(10)"`
	CompanyName     string `xorm:"VARCHAR(255)"`
	CurrentPrice    int64  `xorm:"NOT NULL"` // Stored in cents
	Currency        string `xorm:"VARCHAR(3) NOT NULL"`
	LastUpdatedTime int64  `xorm:"NOT NULL"`
}

// InvestmentCreateRequest represents investment creation request
type InvestmentCreateRequest struct {
	TickerSymbol    string  `json:"tickerSymbol" binding:"required,max=10"`
	CompanyName     string  `json:"companyName" binding:"max=255"`
	Shares          float64 `json:"shares" binding:"required,min=0.0001"`
	PricePerShare   float64 `json:"pricePerShare" binding:"required,min=0.01"`
	Fees            float64 `json:"fees" binding:"min=0"`
	Currency        string  `json:"currency" binding:"required,len=3"`
	TransactionTime int64   `json:"transactionTime" binding:"required,min=1"`
	UtcOffset       int16   `json:"utcOffset" binding:"min=-720,max=840"`
	Comment         string  `json:"comment" binding:"max=255"`
}

// InvestmentModifyRequest represents investment modification request
type InvestmentModifyRequest struct {
	InvestmentId int64 `json:"id,string" binding:"required,min=1"`
	InvestmentCreateRequest
}

// InvestmentTransactionCreateRequest represents investment transaction creation request
type InvestmentTransactionCreateRequest struct {
	Type            InvestmentTransactionType `json:"type" binding:"required"`
	TickerSymbol    string                    `json:"tickerSymbol" binding:"required,max=10"`
	Shares          float64                   `json:"shares" binding:"required,min=0.0001"`
	PricePerShare   float64                   `json:"pricePerShare" binding:"required,min=0.01"`
	Fees            float64                   `json:"fees" binding:"min=0"`
	Currency        string                    `json:"currency" binding:"required,len=3"`
	TransactionTime int64                     `json:"transactionTime" binding:"required,min=1"`
	UtcOffset       int16                     `json:"utcOffset" binding:"min=-720,max=840"`
	Comment         string                    `json:"comment" binding:"max=255"`
}

// InvestmentTransactionModifyRequest represents investment transaction modification request
type InvestmentTransactionModifyRequest struct {
	TransactionId int64 `json:"id,string" binding:"required,min=1"`
	InvestmentTransactionCreateRequest
}

// InvestmentListRequest represents investment list request
type InvestmentListRequest struct {
	TickerSymbol string `form:"tickerSymbol"`
}

// PortfolioSummaryRequest represents portfolio summary request
type PortfolioSummaryRequest struct {
	Currency string `form:"currency"`
}

// PortfolioSummary represents portfolio summary with total value and P&L
type PortfolioSummary struct {
	TotalInvested    int64   `json:"totalInvested"`
	CurrentValue     int64   `json:"currentValue"`
	TotalGainLoss    int64   `json:"totalGainLoss"`
	TotalGainLossPct float64 `json:"totalGainLossPct"`
	Currency         string  `json:"currency"`
}

// InvestmentWithCurrentPrice represents investment holding with current market data
type InvestmentWithCurrentPrice struct {
	*Investment
	CurrentPrice     int64   `json:"currentPrice"`
	CurrentValue     int64   `json:"currentValue"`
	GainLoss         int64   `json:"gainLoss"`
	GainLossPct      float64 `json:"gainLossPct"`
	LastPriceUpdate  int64   `json:"lastPriceUpdate"`
}

// TableName returns the table name of Investment
func (i *Investment) TableName() string {
	return "ebk_investments"
}

// TableName returns the table name of InvestmentTransaction
func (it *InvestmentTransaction) TableName() string {
	return "ebk_investment_transactions"
}

// TableName returns the table name of StockPrice
func (sp *StockPrice) TableName() string {
	return "ebk_stock_prices"
}

// Validate validates investment transaction type
func (t InvestmentTransactionType) Validate() error {
	if t == INVESTMENT_TRANSACTION_TYPE_BUY || t == INVESTMENT_TRANSACTION_TYPE_SELL {
		return nil
	}
	return errs.ErrTransactionTypeInvalid
}