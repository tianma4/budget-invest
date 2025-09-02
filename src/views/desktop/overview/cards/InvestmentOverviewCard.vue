<template>
    <v-card :class="{ 'disabled': loading }">
        <template #title>
            <div class="d-flex align-center">
                <v-icon :icon="mdiTrendingUp" class="me-2" />
                <span>{{ tt('Investment Portfolio') }}</span>
            </div>
        </template>

        <v-card-text>
            <div v-if="!loading && portfolioSummary">
                <!-- Portfolio Value Summary -->
                <v-row class="mb-4">
                    <v-col cols="12" md="6">
                        <div class="d-flex align-center">
                            <div class="me-3">
                                <v-avatar rounded color="success" size="42" class="elevation-1">
                                    <v-icon size="24" :icon="mdiWallet"/>
                                </v-avatar>
                            </div>
                            <div class="d-flex flex-column">
                                <span class="text-caption">{{ tt('Portfolio Value') }}</span>
                                <span class="text-h6 font-weight-bold">{{ portfolioSummary.currentValueDisplay }}</span>
                            </div>
                        </div>
                    </v-col>

                    <v-col cols="12" md="6">
                        <div class="d-flex align-center">
                            <div class="me-3">
                                <v-avatar rounded :color="portfolioSummary.totalGainLoss >= 0 ? 'success' : 'error'" size="42" class="elevation-1">
                                    <v-icon size="24" :icon="portfolioSummary.totalGainLoss >= 0 ? mdiTrendingUp : mdiTrendingDown"/>
                                </v-avatar>
                            </div>
                            <div class="d-flex flex-column">
                                <span class="text-caption">{{ tt('Total P&L') }}</span>
                                <span class="text-h6 font-weight-bold" :class="portfolioSummary.totalGainLoss >= 0 ? 'text-success' : 'text-error'">
                                    {{ portfolioSummary.totalGainLossDisplay }}
                                    <span class="text-body-2 ms-1">
                                        ({{ portfolioSummary.totalGainLoss >= 0 ? '+' : '' }}{{ portfolioSummary.totalGainLossPct.toFixed(2) }}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <!-- Top Holdings -->
                <div v-if="topHoldings.length > 0" class="mb-4">
                    <div class="text-subtitle-2 mb-2 text-medium-emphasis">{{ tt('Top Holdings') }}</div>
                    <v-row dense>
                        <v-col 
                            v-for="holding in topHoldings" 
                            :key="holding.investmentId"
                            cols="12" 
                            md="6"
                        >
                            <div class="d-flex align-center justify-space-between pa-2 bg-surface rounded">
                                <div class="d-flex align-center">
                                    <v-avatar 
                                        size="24" 
                                        :color="getAssetColor(holding.tickerSymbol)"
                                        class="text-white font-weight-bold text-caption me-2"
                                    >
                                        {{ getAssetIcon(holding.tickerSymbol) }}
                                    </v-avatar>
                                    <div>
                                        <div class="text-body-2 font-weight-medium">{{ holding.tickerSymbol }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ holding.sharesOwned.toFixed(2) }} shares</div>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <div class="text-body-2 font-weight-medium">{{ formatCurrency(holding.currentValue) }}</div>
                                    <div class="text-caption" :class="holding.gainLoss >= 0 ? 'text-success' : 'text-error'">
                                        {{ holding.gainLoss >= 0 ? '+' : '' }}{{ holding.gainLossPct.toFixed(1) }}%
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </div>

                <!-- Quick Actions -->
                <div class="d-flex gap-2 mt-4">
                    <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        :prepend-icon="mdiPlus"
                        to="/investment/list"
                    >
                        {{ tt('Add Investment') }}
                    </v-btn>
                    <v-btn 
                        size="small" 
                        variant="text"
                        :prepend-icon="mdiChartLine"
                        to="/investment/list"
                    >
                        {{ tt('View Portfolio') }}
                    </v-btn>
                </div>
            </div>

            <!-- Loading State -->
            <div v-else-if="loading" class="py-4">
                <v-row>
                    <v-col cols="6">
                        <v-skeleton-loader type="avatar, sentences" />
                    </v-col>
                    <v-col cols="6">
                        <v-skeleton-loader type="avatar, sentences" />
                    </v-col>
                </v-row>
                <v-skeleton-loader class="mt-4" type="sentences" />
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-6">
                <v-icon :icon="mdiTrendingUp" size="48" class="text-medium-emphasis mb-3" />
                <div class="text-h6 text-medium-emphasis mb-2">{{ tt('No Investments Yet') }}</div>
                <div class="text-body-2 text-medium-emphasis mb-4">{{ tt('Start building your investment portfolio') }}</div>
                <v-btn 
                    color="primary" 
                    variant="elevated" 
                    :prepend-icon="mdiPlus"
                    to="/investment/list"
                >
                    {{ tt('Add Your First Investment') }}
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore } from '@/stores/investment.ts';
import {
    mdiTrendingUp,
    mdiTrendingDown,
    mdiWallet,
    mdiPlus,
    mdiChartLine
} from '@mdi/js';

interface Props {
    loading?: boolean;
}

withDefaults(defineProps<Props>(), {
    loading: false
});

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const investmentStore = useInvestmentStore();

const portfolioSummary = computed(() => investmentStore.portfolioSummary);
const investments = computed(() => investmentStore.allInvestments);

// Get top 4 holdings by value
const topHoldings = computed(() => {
    return investments.value
        .slice()
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 4);
});

const getAssetColor = (symbol: string) => {
    const colors = {
        'BTC': '#f7931a',
        'ETH': '#627eea',
        'AAPL': '#007aff',
        'NVDA': '#76b900',
        'TSLA': '#cc0000',
        'MSFT': '#00a4ef',
        'GOOGL': '#4285f4',
        'AMZN': '#ff9900'
    };
    return colors[symbol as keyof typeof colors] || '#666666';
};

const getAssetIcon = (symbol: string) => {
    if (symbol.length <= 3) return symbol;
    return symbol.substring(0, 2);
};

const formatCurrency = (amount: number) => {
    return formatAmountToLocalizedNumeralsWithCurrency(amount, 'USD');
};
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>