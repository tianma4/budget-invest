import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { useUserStore } from './user.ts';
import { useExchangeRatesStore } from './exchangeRates.ts';
import { useI18n } from '@/locales/helpers.ts';

import type { HiddenAmount, NumberWithSuffix } from '@/core/numeral.ts';
import { DISPLAY_HIDDEN_AMOUNT } from '@/consts/numeral.ts';

import { isNumber } from '@/lib/common.ts';
import { stockPriceService } from '@/services/stockPrice.ts';

export interface Investment {
    investmentId: string;
    tickerSymbol: string;
    companyName?: string;
    sharesOwned: number;
    avgCostPerShare: number;
    totalInvested: number;
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPct: number;
    currency: string;
    lastPriceUpdate: number;
}

export interface PerformanceDataPoint {
    timestamp: number;
    value: number;
    gainLoss: number;
    gainLossPct: number;
}

export interface PortfolioPerformance {
    '1d': PerformanceDataPoint[];
    '1w': PerformanceDataPoint[];
    '1m': PerformanceDataPoint[];
    '1q': PerformanceDataPoint[];
    '1y': PerformanceDataPoint[];
    '2y': PerformanceDataPoint[];
}

export type TimePeriod = '1d' | '1w' | '1m' | '1q' | '1y' | '2y';

export interface PortfolioSummary {
    totalInvested: number;
    currentValue: number;
    totalGainLoss: number;
    totalGainLossPct: number;
    currency: string;
    totalInvestedDisplay: string;
    currentValueDisplay: string;
    totalGainLossDisplay: string;
}

export const useInvestmentStore = defineStore('investments', () => {
    const userStore = useUserStore();
    const exchangeRatesStore = useExchangeRatesStore();

    const investments = ref<Investment[]>([]);
    const portfolioSummary = ref({
        totalInvested: 0,
        currentValue: 0,
        totalGainLoss: 0,
        totalGainLossPct: 0,
        currency: 'USD'
    });

    // TODO: Replace with actual API calls when backend investment endpoints are implemented
    // For now, using localStorage as temporary persistence until backend APIs are available
    const STORAGE_KEY = 'budget-invest-investments';

    async function saveInvestment(investment: Investment): Promise<void> {
        // TODO: Replace with POST /api/v1/investments/create.json
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const investments = stored ? JSON.parse(stored) : [];
            const existingIndex = investments.findIndex((inv: Investment) => inv.investmentId === investment.investmentId);
            
            if (existingIndex >= 0) {
                investments[existingIndex] = investment;
            } else {
                investments.push(investment);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
        } catch (error) {
            console.error('Failed to save investment:', error);
            throw error;
        }
    }

    async function loadInvestments(): Promise<Investment[]> {
        // TODO: Replace with GET /api/v1/investments/list.json
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as Investment[];
            }
            return [];
        } catch (error) {
            console.error('Failed to load investments:', error);
            return [];
        }
    }

    async function deleteInvestment(investmentId: string): Promise<void> {
        // TODO: Replace with DELETE /api/v1/investments/delete.json
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const investments = JSON.parse(stored) as Investment[];
                const filtered = investments.filter(inv => inv.investmentId !== investmentId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('Failed to delete investment:', error);
            throw error;
        }
    }
    
    const portfolioPerformance = ref<PortfolioPerformance>({
        '1d': [],
        '1w': [],
        '1m': [],
        '1q': [],
        '1y': [],
        '2y': []
    });
    
    const selectedTimePeriod = ref<TimePeriod>('1m');

    const allInvestments = computed<Investment[]>(() => investments.value);

    function getTotalInvestmentValue(showAmount: boolean): number | HiddenAmount | NumberWithSuffix {
        if (!showAmount) {
            return DISPLAY_HIDDEN_AMOUNT;
        }

        let totalValue = 0;
        let hasUnCalculatedAmount = false;

        for (let i = 0; i < investments.value.length; i++) {
            const investment = investments.value[i];
            
            if (investment.currency === userStore.currentUserDefaultCurrency) {
                totalValue += investment.currentValue;
            } else {
                const exchangedValue = exchangeRatesStore.getExchangedAmount(
                    investment.currentValue, 
                    investment.currency, 
                    userStore.currentUserDefaultCurrency
                );

                if (!isNumber(exchangedValue)) {
                    hasUnCalculatedAmount = true;
                    continue;
                }

                totalValue += Math.floor(exchangedValue);
            }
        }

        if (hasUnCalculatedAmount) {
            return {
                value: totalValue,
                suffix: '+'
            };
        }

        return totalValue;
    }

    async function loadAllInvestments() {
        try {
            const storedInvestments = await loadInvestments();
            
            if (storedInvestments.length > 0) {
                investments.value = storedInvestments;
            } else {
                // Initialize with mock data if no stored investments
                const mockInvestments = [
                    {
                        investmentId: '1',
                        tickerSymbol: 'AAPL',
                        companyName: 'Apple Inc.',
                        sharesOwned: 10,
                        avgCostPerShare: 15000, // $150.00 in cents
                        totalInvested: 150000, // $1500.00 in cents
                        currentPrice: 18000, // $180.00 in cents
                        currentValue: 180000, // $1800.00 in cents
                        gainLoss: 30000, // $300.00 in cents
                        gainLossPct: 20,
                        currency: 'USD',
                        lastPriceUpdate: Date.now()
                    },
                    {
                        investmentId: '2',
                        tickerSymbol: 'NVDA',
                        companyName: 'NVIDIA Corporation',
                        sharesOwned: 5,
                        avgCostPerShare: 45000, // $450.00 in cents
                        totalInvested: 225000, // $2250.00 in cents
                        currentPrice: 52000, // $520.00 in cents
                        currentValue: 260000, // $2600.00 in cents
                        gainLoss: 35000, // $350.00 in cents
                        gainLossPct: 15.56,
                        currency: 'USD',
                        lastPriceUpdate: Date.now()
                    }
                ];
                
                investments.value = mockInvestments;
                // Save mock data for persistence
                for (const investment of mockInvestments) {
                    await saveInvestment(investment);
                }
            }
            
            updatePortfolioSummary();
        } catch (error) {
            console.error('Failed to load investments:', error);
        }
    }

    async function addInvestment(investmentData: {
        tickerSymbol: string;
        companyName?: string;
        shares: number;
        pricePerShare: number;
        fees: number;
        currency: string;
        comment?: string;
    }): Promise<Investment> {
        try {
            // Convert to cents for internal storage
            const pricePerShareInCents = Math.round(investmentData.pricePerShare * 100);
            const feesInCents = Math.round(investmentData.fees * 100);
            const totalInvestedInCents = Math.round(investmentData.shares * investmentData.pricePerShare * 100) + feesInCents;
            const avgCostPerShareInCents = Math.round(totalInvestedInCents / investmentData.shares);

            const newInvestment: Investment = {
                investmentId: Date.now().toString(), // Simple ID generation
                tickerSymbol: investmentData.tickerSymbol.toUpperCase(),
                companyName: investmentData.companyName,
                sharesOwned: investmentData.shares,
                avgCostPerShare: avgCostPerShareInCents,
                totalInvested: totalInvestedInCents,
                currentPrice: pricePerShareInCents, // Use purchase price as current price initially
                currentValue: Math.round(investmentData.shares * investmentData.pricePerShare * 100),
                gainLoss: 0, // No gain/loss initially
                gainLossPct: 0,
                currency: investmentData.currency,
                lastPriceUpdate: Date.now()
            };

            // Save to persistent storage (localStorage temporarily, database eventually)
            await saveInvestment(newInvestment);
            
            // Update local state
            investments.value.push(newInvestment);
            updatePortfolioSummary();
            
            return newInvestment;
        } catch (error) {
            console.error('Failed to add investment:', error);
            throw error;
        }
    }

    async function updateInvestmentWithTransaction(investmentId: string, transaction: {
        type: 'buy' | 'sell';
        shares: number;
        pricePerShare: number;
        fees: number;
        transactionDate: Date;
        comment?: string;
    }): Promise<void> {
        try {
            const investment = investments.value.find(inv => inv.investmentId === investmentId);
            if (!investment) {
                throw new Error('Investment not found');
            }

            const priceInCents = Math.round(transaction.pricePerShare * 100);
            const feesInCents = Math.round(transaction.fees * 100);
            const totalAmount = Math.round(transaction.shares * transaction.pricePerShare * 100) + feesInCents;

            if (transaction.type === 'buy') {
                // Calculate new average cost per share
                const currentTotalCost = investment.sharesOwned * investment.avgCostPerShare;
                const newTotalCost = currentTotalCost + totalAmount;
                const newTotalShares = investment.sharesOwned + transaction.shares;
                
                investment.sharesOwned = newTotalShares;
                investment.avgCostPerShare = Math.round(newTotalCost / newTotalShares);
                investment.totalInvested += totalAmount;
            } else { // sell
                if (transaction.shares > investment.sharesOwned) {
                    throw new Error('Cannot sell more shares than owned');
                }
                
                investment.sharesOwned -= transaction.shares;
                const proportionSold = transaction.shares / (investment.sharesOwned + transaction.shares);
                investment.totalInvested -= Math.round(investment.totalInvested * proportionSold);
            }

            // Update current price to the transaction price (real market data)
            investment.currentPrice = priceInCents;
            
            // Update current value based on current price
            investment.currentValue = Math.round(investment.sharesOwned * investment.currentPrice);
            investment.gainLoss = investment.currentValue - investment.totalInvested;
            investment.gainLossPct = investment.totalInvested > 0 ? 
                (investment.gainLoss / investment.totalInvested) * 100 : 0;
            investment.lastPriceUpdate = Date.now();

            // Save updated investment to storage
            await saveInvestment(investment);
            
            // Reload investments to ensure reactivity
            await loadAllInvestments();
        } catch (error) {
            console.error('Failed to update investment with transaction:', error);
            throw error;
        }
    }

    function updatePortfolioSummary() {
        const totalInvested = investments.value.reduce((sum, inv) => sum + inv.totalInvested, 0);
        const currentValue = investments.value.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalGainLoss = currentValue - totalInvested;
        const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        portfolioSummary.value.totalInvested = totalInvested;
        portfolioSummary.value.currentValue = currentValue;
        portfolioSummary.value.totalGainLoss = totalGainLoss;
        portfolioSummary.value.totalGainLossPct = totalGainLossPct;
        portfolioSummary.value.currency = 'USD';
        
        // Regenerate performance data when portfolio changes
        generateMockPerformanceData();
    }

    function generateMockPerformanceData() {
        const now = Date.now();
        const periods = {
            '1d': { days: 1, intervals: 24 }, // Hourly data
            '1w': { days: 7, intervals: 7 }, // Daily data
            '1m': { days: 30, intervals: 30 }, // Daily data
            '1q': { days: 90, intervals: 90 }, // Daily data
            '1y': { days: 365, intervals: 52 }, // Weekly data
            '2y': { days: 730, intervals: 104 } // Weekly data
        };

        Object.entries(periods).forEach(([period, config]) => {
            const data: PerformanceDataPoint[] = [];
            const totalInvested = portfolioSummary.value.totalInvested;
            
            if (totalInvested === 0) {
                portfolioPerformance.value[period as TimePeriod] = [];
                return;
            }

            const baseValue = totalInvested;
            let currentValue = baseValue;

            for (let i = config.intervals; i >= 0; i--) {
                const timeOffset = (config.days * 24 * 60 * 60 * 1000 / config.intervals) * i;
                const timestamp = now - timeOffset;
                
                // Generate some realistic market movement (random walk with slight upward trend)
                const dailyChange = (Math.random() - 0.48) * 0.03; // Slight positive bias
                const changeMultiplier = 1 + dailyChange;
                
                if (i === 0) {
                    // Use current actual value for the most recent point
                    currentValue = portfolioSummary.value.currentValue;
                } else {
                    currentValue = Math.max(baseValue * 0.7, currentValue * changeMultiplier); // Prevent too much loss
                }

                const gainLoss = currentValue - totalInvested;
                const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

                data.push({
                    timestamp,
                    value: Math.round(currentValue),
                    gainLoss: Math.round(gainLoss),
                    gainLossPct: parseFloat(gainLossPct.toFixed(2))
                });
            }

            portfolioPerformance.value[period as TimePeriod] = data.sort((a, b) => a.timestamp - b.timestamp);
        });
    }

    function setTimePeriod(period: TimePeriod) {
        selectedTimePeriod.value = period;
    }

    async function refreshStockPrices(): Promise<void> {
        try {
            if (investments.value.length === 0) {
                return;
            }

            // Get unique ticker symbols
            const symbols = [...new Set(investments.value.map(inv => inv.tickerSymbol))];
            
            // Fetch current prices
            const stockPrices = await stockPriceService.getMultipleStockPrices(symbols);
            
            let hasUpdates = false;
            
            // Update investments with new prices
            investments.value.forEach(investment => {
                const stockQuote = stockPrices.get(investment.tickerSymbol.toUpperCase());
                
                if (stockQuote) {
                    // Update current price
                    investment.currentPrice = stockQuote.price;
                    investment.lastPriceUpdate = stockQuote.lastUpdate;
                    
                    // Recalculate current value and gains/losses
                    investment.currentValue = Math.round(investment.sharesOwned * investment.currentPrice);
                    investment.gainLoss = investment.currentValue - investment.totalInvested;
                    investment.gainLossPct = investment.totalInvested > 0 ? 
                        (investment.gainLoss / investment.totalInvested) * 100 : 0;
                    
                    hasUpdates = true;
                }
            });
            
            if (hasUpdates) {
                // Save updated investments to localStorage
                for (const investment of investments.value) {
                    await saveInvestment(investment);
                }
                
                // Update portfolio summary
                updatePortfolioSummary();
            }
            
        } catch (error) {
            console.error('Failed to refresh stock prices:', error);
            throw error;
        }
    }

    // Computed properties for display values to ensure reactivity
    const portfolioSummaryDisplay = computed(() => {
        const { formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
        return {
            ...portfolioSummary.value,
            totalInvestedDisplay: formatAmountToLocalizedNumeralsWithCurrency(portfolioSummary.value.totalInvested, 'USD'),
            currentValueDisplay: formatAmountToLocalizedNumeralsWithCurrency(portfolioSummary.value.currentValue, 'USD'),
            totalGainLossDisplay: formatAmountToLocalizedNumeralsWithCurrency(portfolioSummary.value.totalGainLoss, 'USD')
        };
    });

    // Get current period performance data
    const currentPerformanceData = computed(() => portfolioPerformance.value[selectedTimePeriod.value]);
    
    // Get performance summary for selected period
    const performanceSummary = computed(() => {
        const data = currentPerformanceData.value;
        if (data.length < 2) {
            return {
                periodGainLoss: 0,
                periodGainLossPct: 0,
                periodStartValue: 0,
                periodEndValue: 0,
                periodGainLossDisplay: '$0.00',
                timePeriod: selectedTimePeriod.value
            };
        }

        const startPoint = data[0];
        const endPoint = data[data.length - 1];
        const periodGainLoss = endPoint.value - startPoint.value;
        const periodGainLossPct = startPoint.value > 0 ? (periodGainLoss / startPoint.value) * 100 : 0;

        const { formatAmountToLocalizedNumeralsWithCurrency } = useI18n();

        return {
            periodGainLoss,
            periodGainLossPct: parseFloat(periodGainLossPct.toFixed(2)),
            periodStartValue: startPoint.value,
            periodEndValue: endPoint.value,
            periodGainLossDisplay: formatAmountToLocalizedNumeralsWithCurrency(periodGainLoss, 'USD'),
            timePeriod: selectedTimePeriod.value
        };
    });

    // Initialize with stored data
    loadAllInvestments();

    return {
        investments,
        portfolioSummary: portfolioSummaryDisplay,
        portfolioPerformance,
        selectedTimePeriod,
        currentPerformanceData,
        performanceSummary,
        allInvestments,
        getTotalInvestmentValue,
        loadAllInvestments,
        updatePortfolioSummary,
        addInvestment,
        updateInvestmentWithTransaction,
        deleteInvestment,
        setTimePeriod,
        generateMockPerformanceData,
        refreshStockPrices
    };
});