package services

import (
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/log"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/uuid"
)

// InvestmentService represents investment service
type InvestmentService struct {
	ServiceUsingDB
	ServiceUsingUuid
	container         *datastore.DataStoreContainer
	stockPriceService *StockPriceService
}

// GetAllInvestments returns all investments for a user with current prices
func (s *InvestmentService) GetAllInvestments(c core.Context, uid int64) ([]*models.InvestmentWithCurrentPrice, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	sess := s.UserDataDB(uid).NewSession(c)
	defer sess.Close()

	var investments []*models.Investment
	err := sess.Where("uid=? AND deleted=?", uid, false).OrderBy("ticker_symbol").Find(&investments)
	if err != nil {
		return nil, err
	}

	// Create InvestmentWithCurrentPrice structs with current prices
	result := make([]*models.InvestmentWithCurrentPrice, len(investments))
	for i, investment := range investments {
		investmentWithPrice := &models.InvestmentWithCurrentPrice{
			Investment: investment,
		}
		
		stockPrice, err := s.stockPriceService.GetStockPrice(c, investment.TickerSymbol)
		if err != nil {
			log.Warnf(c, "[investments.GetAllInvestments] failed to get stock price for %s, error %s", investment.TickerSymbol, err.Error())
			investmentWithPrice.CurrentPrice = 0
		} else {
			investmentWithPrice.CurrentPrice = stockPrice.CurrentPrice
			investmentWithPrice.LastPriceUpdate = stockPrice.LastUpdatedTime
		}

		// Calculate current value and P&L
		s.calculateInvestmentMetrics(investmentWithPrice)
		result[i] = investmentWithPrice
	}

	return result, nil
}

// GetInvestment returns a specific investment by ID
func (s *InvestmentService) GetInvestment(c core.Context, uid int64, investmentId int64) (*models.InvestmentWithCurrentPrice, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	if investmentId <= 0 {
		return nil, errs.ErrInvestmentIdInvalid
	}

	sess := s.UserDataDB(uid).NewSession(c)
	defer sess.Close()

	var investment models.Investment
	has, err := sess.Where("uid=? AND investment_id=? AND deleted=?", uid, investmentId, false).Get(&investment)
	if err != nil {
		return nil, err
	}

	if !has {
		return nil, errs.ErrInvestmentNotFound
	}

	// Create InvestmentWithCurrentPrice with current price
	result := &models.InvestmentWithCurrentPrice{
		Investment: &investment,
	}
	
	stockPrice, err := s.stockPriceService.GetStockPrice(c, investment.TickerSymbol)
	if err != nil {
		log.Warnf(c, "[investments.GetInvestment] failed to get stock price for %s, error %s", investment.TickerSymbol, err.Error())
		result.CurrentPrice = 0
	} else {
		result.CurrentPrice = stockPrice.CurrentPrice
		result.LastPriceUpdate = stockPrice.LastUpdatedTime
	}

	// Calculate current value and P&L
	s.calculateInvestmentMetrics(result)

	return result, nil
}

// CreateInvestment creates a new investment
func (s *InvestmentService) CreateInvestment(c core.Context, investment *models.Investment) error {
	if investment.Uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if investment.TickerSymbol == "" {
		return errs.ErrTickerSymbolIsEmpty
	}

	if investment.SharesOwned <= 0 {
		return errs.ErrInvalidSharesAmount
	}

	if investment.AvgCostPerShare <= 0 {
		return errs.ErrInvalidCostPerShare
	}

	// Check if investment already exists for this user and ticker
	existing, err := s.getInvestmentByTicker(c, investment.Uid, investment.TickerSymbol)
	if err != nil && err != errs.ErrInvestmentNotFound {
		return err
	}

	if existing != nil {
		return errs.ErrInvestmentAlreadyExists
	}

	sess := s.UserDataDB(investment.Uid).NewSession(c)
	defer sess.Close()

	investment.InvestmentId = s.GenerateUuid(uuid.UUID_TYPE_INVESTMENT)
	investment.TotalInvested = s.convertPriceFromFloat64(float64(investment.AvgCostPerShare)/100 * investment.SharesOwned)
	investment.CreatedUnixTime = time.Now().Unix()
	investment.UpdatedUnixTime = time.Now().Unix()
	investment.Deleted = false

	_, err = sess.Insert(investment)
	return err
}

// UpdateInvestment updates an existing investment
func (s *InvestmentService) UpdateInvestment(c core.Context, investment *models.Investment) error {
	if investment.Uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if investment.InvestmentId <= 0 {
		return errs.ErrInvestmentIdInvalid
	}

	if investment.SharesOwned <= 0 {
		return errs.ErrInvalidSharesAmount
	}

	if investment.AvgCostPerShare <= 0 {
		return errs.ErrInvalidCostPerShare
	}

	sess := s.UserDataDB(investment.Uid).NewSession(c)
	defer sess.Close()

	// Verify investment exists and belongs to user
	existing := &models.Investment{}
	has, err := sess.Where("uid=? AND investment_id=? AND deleted=?", investment.Uid, investment.InvestmentId, false).Get(existing)
	if err != nil {
		return err
	}

	if !has {
		return errs.ErrInvestmentNotFound
	}

	investment.TotalInvested = s.convertPriceFromFloat64(float64(investment.AvgCostPerShare)/100 * investment.SharesOwned)
	investment.UpdatedUnixTime = time.Now().Unix()

	_, err = sess.Where("uid=? AND investment_id=?", investment.Uid, investment.InvestmentId).Update(investment)
	return err
}

// DeleteInvestment soft deletes an investment
func (s *InvestmentService) DeleteInvestment(c core.Context, uid int64, investmentId int64) error {
	if uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if investmentId <= 0 {
		return errs.ErrInvestmentIdInvalid
	}

	sess := s.UserDataDB(uid).NewSession(c)
	defer sess.Close()

	// Verify investment exists and belongs to user
	existing := &models.Investment{}
	has, err := sess.Where("uid=? AND investment_id=? AND deleted=?", uid, investmentId, false).Get(existing)
	if err != nil {
		return err
	}

	if !has {
		return errs.ErrInvestmentNotFound
	}

	// Soft delete
	_, err = sess.Where("uid=? AND investment_id=?", uid, investmentId).Update(&models.Investment{
		Deleted:           true,
		UpdatedUnixTime:   time.Now().Unix(),
	})

	return err
}

// AddInvestmentTransaction creates a new investment transaction (buy/sell)
func (s *InvestmentService) AddInvestmentTransaction(c core.Context, transaction *models.InvestmentTransaction) error {
	if transaction.Uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if transaction.TickerSymbol == "" {
		return errs.ErrTickerSymbolIsEmpty
	}

	if transaction.Shares <= 0 {
		return errs.ErrInvalidSharesAmount
	}

	if transaction.PricePerShare <= 0 {
		return errs.ErrInvalidPricePerShare
	}

	sess := s.UserDataDB(transaction.Uid).NewSession(c)
	defer sess.Close()

	// Start transaction
	err := sess.Begin()
	if err != nil {
		return err
	}
	defer sess.Rollback()

	// Find investment by ticker symbol
	investment := &models.Investment{}
	has, err := sess.Where("uid=? AND ticker_symbol=? AND deleted=?", transaction.Uid, transaction.TickerSymbol, false).Get(investment)
	if err != nil {
		return err
	}

	if !has {
		return errs.ErrInvestmentNotFound
	}

	// Create transaction record
	transaction.TransactionId = s.GenerateUuid(uuid.UUID_TYPE_INVESTMENT_TRANSACTION)
	transaction.TotalAmount = s.convertPriceFromFloat64(float64(transaction.PricePerShare)/100 * transaction.Shares)
	transaction.CreatedUnixTime = time.Now().Unix()
	transaction.UpdatedUnixTime = time.Now().Unix()

	_, err = sess.Insert(transaction)
	if err != nil {
		return err
	}

	// Update investment totals
	if transaction.Type == models.INVESTMENT_TRANSACTION_TYPE_BUY {
		// Buy: increase shares and recalculate average cost
		newTotalShares := investment.SharesOwned + transaction.Shares
		newTotalInvested := investment.TotalInvested + transaction.TotalAmount
		newAvgCost := s.convertPriceFromFloat64(float64(newTotalInvested) / 100 / newTotalShares)

		investment.SharesOwned = newTotalShares
		investment.TotalInvested = newTotalInvested
		investment.AvgCostPerShare = newAvgCost
	} else {
		// Sell: decrease shares, keep same average cost
		if investment.SharesOwned < transaction.Shares {
			return errs.ErrInsufficientShares
		}

		newTotalShares := investment.SharesOwned - transaction.Shares
		newTotalInvested := s.convertPriceFromFloat64(float64(investment.AvgCostPerShare)/100 * newTotalShares)

		investment.SharesOwned = newTotalShares
		investment.TotalInvested = newTotalInvested
	}

	investment.UpdatedUnixTime = time.Now().Unix()

	_, err = sess.Where("uid=? AND investment_id=?", investment.Uid, investment.InvestmentId).Update(investment)
	if err != nil {
		return err
	}

	return sess.Commit()
}

// GetPortfolioSummary returns portfolio summary with total value and P&L
func (s *InvestmentService) GetPortfolioSummary(c core.Context, uid int64) (*models.PortfolioSummary, error) {
	investments, err := s.GetAllInvestments(c, uid)
	if err != nil {
		return nil, err
	}

	summary := &models.PortfolioSummary{
		TotalInvested: 0,
		CurrentValue:  0,
		TotalGainLoss: 0,
		Currency:      "USD", // Default currency
	}

	for _, investment := range investments {
		summary.TotalInvested += investment.Investment.TotalInvested
		summary.CurrentValue += investment.CurrentValue
	}

	summary.TotalGainLoss = summary.CurrentValue - summary.TotalInvested
	if summary.TotalInvested > 0 {
		summary.TotalGainLossPct = float64(summary.TotalGainLoss) / float64(summary.TotalInvested) * 100
	}

	return summary, nil
}

// Helper methods

func (s *InvestmentService) getInvestmentByTicker(c core.Context, uid int64, tickerSymbol string) (*models.Investment, error) {
	sess := s.UserDataDB(uid).NewSession(c)
	defer sess.Close()

	var investment models.Investment
	has, err := sess.Where("uid=? AND ticker_symbol=? AND deleted=?", uid, tickerSymbol, false).Get(&investment)
	if err != nil {
		return nil, err
	}

	if !has {
		return nil, errs.ErrInvestmentNotFound
	}

	return &investment, nil
}

func (s *InvestmentService) calculateInvestmentMetrics(investment *models.InvestmentWithCurrentPrice) {
	if investment.CurrentPrice > 0 {
		investment.CurrentValue = s.convertPriceFromFloat64(float64(investment.CurrentPrice)/100 * investment.Investment.SharesOwned)
		investment.GainLoss = investment.CurrentValue - investment.Investment.TotalInvested
		
		if investment.Investment.TotalInvested > 0 {
			investment.GainLossPct = float64(investment.GainLoss) / float64(investment.Investment.TotalInvested) * 100
		}
	}
}

func (s *InvestmentService) convertPriceFromFloat64(price float64) int64 {
	return int64(price * 100)
}

// NewInvestmentService returns new investment service
func NewInvestmentService(container *datastore.DataStoreContainer, uuidContainer *uuid.UuidContainer, stockPriceService *StockPriceService) *InvestmentService {
	return &InvestmentService{
		ServiceUsingDB: ServiceUsingDB{
			container: container,
		},
		ServiceUsingUuid: ServiceUsingUuid{
			container: uuidContainer,
		},
		container:         container,
		stockPriceService: stockPriceService,
	}
}