package errs

// Investment subcategory (add to existing subcategories in error.go)
const (
	NormalSubcategoryInvestment = 15
)

var (
	// Investment
	ErrInvestmentIdInvalid         = NewNormalError(NormalSubcategoryInvestment, 1, 400, "Investment id is invalid")
	ErrInvestmentNotFound          = NewNormalError(NormalSubcategoryInvestment, 2, 400, "Investment not found")
	ErrInvestmentAlreadyExists     = NewNormalError(NormalSubcategoryInvestment, 3, 400, "Investment already exists for this ticker")
	ErrTickerSymbolIsEmpty         = NewNormalError(NormalSubcategoryInvestment, 4, 400, "Ticker symbol cannot be empty")
	ErrInvalidSharesAmount         = NewNormalError(NormalSubcategoryInvestment, 5, 400, "Invalid number of shares")
	ErrInvalidCostPerShare         = NewNormalError(NormalSubcategoryInvestment, 6, 400, "Invalid cost per share")
	ErrInvalidPricePerShare        = NewNormalError(NormalSubcategoryInvestment, 7, 400, "Invalid price per share")
	ErrInsufficientShares          = NewNormalError(NormalSubcategoryInvestment, 8, 400, "Insufficient shares for this transaction")
	
	// Stock Price
	ErrStockPriceNotFound          = NewNormalError(NormalSubcategoryInvestment, 101, 400, "Stock price not found")
	ErrStockPriceServiceUnavailable = NewNormalError(NormalSubcategoryInvestment, 102, 503, "Stock price service unavailable")
)