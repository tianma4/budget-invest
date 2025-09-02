package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
)

func TestInvestmentTransactionType_Validate(t *testing.T) {
	// Test valid transaction types
	buyType := INVESTMENT_TRANSACTION_TYPE_BUY
	err := buyType.Validate()
	assert.Nil(t, err)

	sellType := INVESTMENT_TRANSACTION_TYPE_SELL
	err = sellType.Validate()
	assert.Nil(t, err)

	// Test invalid transaction type
	invalidType := InvestmentTransactionType(99)
	err = invalidType.Validate()
	assert.Equal(t, errs.ErrTransactionTypeInvalid, err)
}

func TestInvestmentTableName(t *testing.T) {
	investment := &Investment{}
	assert.Equal(t, "ebk_investments", investment.TableName())
}

func TestInvestmentTransactionTableName(t *testing.T) {
	transaction := &InvestmentTransaction{}
	assert.Equal(t, "ebk_investment_transactions", transaction.TableName())
}

func TestStockPriceTableName(t *testing.T) {
	stockPrice := &StockPrice{}
	assert.Equal(t, "ebk_stock_prices", stockPrice.TableName())
}