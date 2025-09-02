package services

import (
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/uuid"
)

// Initialize investment services singleton instances
var (
	// StockPrices is the stock price service singleton
	StockPrices = &StockPriceService{
		ServiceUsingDB: ServiceUsingDB{
			container: datastore.Container,
		},
		container: datastore.Container,
	}
	
	// Investments is the investment service singleton
	Investments = &InvestmentService{
		ServiceUsingDB: ServiceUsingDB{
			container: datastore.Container,
		},
		ServiceUsingUuid: ServiceUsingUuid{
			container: uuid.Container,
		},
		container:         datastore.Container,
		stockPriceService: StockPrices,
	}
)