import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { useUserStore } from './user.ts';
import { useExchangeRatesStore } from './exchangeRates.ts';
import { useI18n } from '@/locales/helpers.ts';

import type { HiddenAmount, NumberWithSuffix } from '@/core/numeral.ts';
import { DISPLAY_HIDDEN_AMOUNT } from '@/consts/numeral.ts';

import { isNumber } from '@/lib/common.ts';

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
    const portfolioSummary = ref<PortfolioSummary>({
        totalInvested: 0,
        currentValue: 0,
        totalGainLoss: 0,
        totalGainLossPct: 0,
        currency: 'USD',
        totalInvestedDisplay: '$0.00',
        currentValueDisplay: '$0.00',
        totalGainLossDisplay: '$0.00'
    });

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

    function loadMockInvestments() {
        // Mock data - replace with actual API call
        investments.value = [
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

        updatePortfolioSummary();
    }

    function updatePortfolioSummary() {
        const { formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
        
        const totalInvested = investments.value.reduce((sum, inv) => sum + inv.totalInvested, 0);
        const currentValue = investments.value.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalGainLoss = currentValue - totalInvested;
        const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        portfolioSummary.value = {
            totalInvested,
            currentValue,
            totalGainLoss,
            totalGainLossPct,
            currency: 'USD',
            totalInvestedDisplay: formatAmountToLocalizedNumeralsWithCurrency(totalInvested, 'USD'),
            currentValueDisplay: formatAmountToLocalizedNumeralsWithCurrency(currentValue, 'USD'),
            totalGainLossDisplay: formatAmountToLocalizedNumeralsWithCurrency(totalGainLoss, 'USD')
        };
    }

    // Initialize with mock data
    loadMockInvestments();

    return {
        investments,
        portfolioSummary,
        allInvestments,
        getTotalInvestmentValue,
        loadMockInvestments,
        updatePortfolioSummary
    };
});