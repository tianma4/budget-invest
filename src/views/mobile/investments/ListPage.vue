<template>
    <div class="investments-mobile">
        <!-- Header -->
        <div class="px-4 py-6 bg-surface">
            <div class="d-flex align-center justify-space-between mb-4">
                <div>
                    <h4 class="text-h5 font-weight-bold">{{ tt('Investments') }}</h4>
                    <span class="text-body-2 text-medium-emphasis">{{ tt('Portfolio Management') }}</span>
                </div>
                <v-btn 
                    color="primary" 
                    variant="elevated" 
                    size="small"
                    @click="showAddInvestmentDialog = true"
                >
                    <v-icon :icon="mdiPlus" class="me-1" />
                    {{ tt('Add') }}
                </v-btn>
            </div>
            
            <!-- Portfolio Summary Card -->
            <v-card class="mb-4" variant="outlined">
                <v-card-text>
                    <div class="text-subtitle-2 text-medium-emphasis mb-2">{{ tt('Portfolio Summary') }}</div>
                    <div class="d-flex align-center justify-space-between mb-3">
                        <div>
                            <div class="text-caption text-medium-emphasis">{{ tt('Total Invested') }}</div>
                            <div class="text-h6 font-weight-bold">{{ portfolioSummary.totalInvestedDisplay }}</div>
                        </div>
                        <div class="text-end">
                            <div class="text-caption text-medium-emphasis">{{ tt('Current Value') }}</div>
                            <div class="text-h6 font-weight-bold">{{ portfolioSummary.currentValueDisplay }}</div>
                        </div>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                        <div class="text-caption text-medium-emphasis">{{ tt('Total P&L') }}</div>
                        <div class="text-end">
                            <div class="text-subtitle-1 font-weight-bold" 
                                 :class="portfolioSummary.totalGainLoss >= 0 ? 'text-success' : 'text-error'">
                                {{ portfolioSummary.totalGainLossDisplay }}
                            </div>
                            <div class="text-caption" 
                                 :class="portfolioSummary.totalGainLoss >= 0 ? 'text-success' : 'text-error'">
                                {{ portfolioSummary.totalGainLoss >= 0 ? '+' : '' }}{{ portfolioSummary.totalGainLossPct.toFixed(2) }}%
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </div>

        <!-- Performance Chart Mobile -->
        <div class="px-4 mb-4">
            <performance-chart-mobile />
        </div>

        <!-- Action Buttons -->
        <div class="px-4 mb-4">
            <v-row dense>
                <v-col cols="6">
                    <v-btn 
                        block 
                        variant="outlined" 
                        color="secondary"
                        :loading="loading"
                        @click="refreshPrices"
                    >
                        <v-icon :icon="mdiRefresh" class="me-1" />
                        {{ tt('Refresh') }}
                    </v-btn>
                </v-col>
                <v-col cols="6">
                    <v-btn 
                        block 
                        variant="elevated" 
                        color="primary"
                        @click="showAddInvestmentDialog = true"
                    >
                        <v-icon :icon="mdiPlus" class="me-1" />
                        {{ tt('Add Investment') }}
                    </v-btn>
                </v-col>
            </v-row>
        </div>

        <!-- Investment Cards -->
        <div class="px-4">
            <div v-if="loading" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" />
                <div class="text-body-2 text-medium-emphasis mt-2">{{ tt('Loading investments...') }}</div>
            </div>
            
            <div v-else-if="investments.length === 0" class="text-center py-8">
                <v-icon icon="mdi-trending-up" size="64" class="text-medium-emphasis mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">{{ tt('No investments yet') }}</div>
                <div class="text-body-2 text-medium-emphasis mb-4">{{ tt('Start building your portfolio') }}</div>
                <v-btn 
                    color="primary" 
                    variant="elevated"
                    @click="showAddInvestmentDialog = true"
                >
                    <v-icon :icon="mdiPlus" class="me-2" />
                    {{ tt('Add Your First Investment') }}
                </v-btn>
            </div>
            
            <div v-else class="investment-cards">
                <v-card 
                    v-for="investment in investments" 
                    :key="investment.investmentId"
                    class="mb-3"
                    variant="outlined"
                    @click="viewInvestmentDetails(investment)"
                >
                    <v-card-text class="pb-2">
                        <!-- Header Row -->
                        <div class="d-flex align-center justify-space-between mb-2">
                            <div class="d-flex align-center">
                                <div class="investment-icon me-3">
                                    <v-avatar 
                                        size="32" 
                                        :color="getAssetColor(investment.tickerSymbol)"
                                        class="text-white font-weight-bold text-caption"
                                    >
                                        {{ getAssetIcon(investment.tickerSymbol) }}
                                    </v-avatar>
                                </div>
                                <div>
                                    <div class="text-subtitle-1 font-weight-bold">{{ investment.tickerSymbol }}</div>
                                    <div class="text-caption text-medium-emphasis" v-if="investment.companyName">
                                        {{ investment.companyName }}
                                    </div>
                                </div>
                            </div>
                            <v-btn 
                                icon 
                                variant="text" 
                                size="small" 
                                @click.stop="openActionMenu(investment, $event)"
                            >
                                <v-icon :icon="mdiDotsVertical" />
                            </v-btn>
                        </div>

                        <!-- Investment Details -->
                        <v-row dense class="mb-2">
                            <v-col cols="6">
                                <div class="text-caption text-medium-emphasis">{{ tt('Shares') }}</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ investment.sharesOwned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) }}
                                </div>
                            </v-col>
                            <v-col cols="6">
                                <div class="text-caption text-medium-emphasis">{{ tt('Current Price') }}</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(investment.currentPrice, investment.currency) }}
                                </div>
                            </v-col>
                        </v-row>

                        <v-row dense class="mb-2">
                            <v-col cols="6">
                                <div class="text-caption text-medium-emphasis">{{ tt('Total Invested') }}</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(investment.totalInvested, investment.currency) }}
                                </div>
                            </v-col>
                            <v-col cols="6">
                                <div class="text-caption text-medium-emphasis">{{ tt('Current Value') }}</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(investment.currentValue, investment.currency) }}
                                </div>
                            </v-col>
                        </v-row>

                        <!-- P&L Row -->
                        <div class="d-flex align-center justify-space-between pt-2 border-t-thin">
                            <div class="text-caption text-medium-emphasis">{{ tt('P&L') }}</div>
                            <div class="text-end">
                                <div class="text-body-1 font-weight-bold" 
                                     :class="investment.gainLoss >= 0 ? 'text-success' : 'text-error'">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(investment.gainLoss, investment.currency) }}
                                </div>
                                <div class="text-caption" 
                                     :class="investment.gainLoss >= 0 ? 'text-success' : 'text-error'">
                                    {{ investment.gainLoss >= 0 ? '+' : '' }}{{ investment.gainLossPct.toFixed(2) }}%
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </div>

        <!-- Action Menu -->
        <v-menu
            v-model="showActionMenu"
            :activator="actionMenuActivator"
            location="bottom end"
        >
            <v-list>
                <v-list-item @click="editInvestment(selectedInvestment)">
                    <v-list-item-title>
                        <v-icon :icon="mdiPencil" class="me-2" />
                        {{ tt('Edit') }}
                    </v-list-item-title>
                </v-list-item>
                <v-list-item @click="addTransaction(selectedInvestment)">
                    <v-list-item-title>
                        <v-icon :icon="mdiSwapHorizontal" class="me-2" />
                        {{ tt('Buy/Sell') }}
                    </v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="deleteInvestment(selectedInvestment)" class="text-error">
                    <v-list-item-title>
                        <v-icon :icon="mdiDelete" class="me-2" />
                        {{ tt('Delete') }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>

    <!-- Dialogs -->
    <add-investment-dialog 
        :show="showAddInvestmentDialog"
        @update:show="showAddInvestmentDialog = $event"
        @added="onInvestmentAdded"
    />

    <edit-investment-dialog 
        :show="showEditInvestmentDialog"
        :investment="selectedInvestment"
        @update:show="showEditInvestmentDialog = $event"
        @updated="onInvestmentUpdated"
    />

    <investment-transaction-dialog 
        :show="showTransactionDialog"
        :investment="selectedInvestment"
        @update:show="showTransactionDialog = $event"
        @added="onTransactionAdded"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
    mdiPlus,
    mdiRefresh,
    mdiDotsVertical,
    mdiPencil,
    mdiSwapHorizontal,
    mdiDelete
} from '@mdi/js';

import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore, type Investment } from '@/stores/investment.ts';

// Import dialogs and components
import AddInvestmentDialog from '../desktop/investments/dialogs/AddInvestmentDialog.vue';
import EditInvestmentDialog from '../desktop/investments/dialogs/EditInvestmentDialog.vue';
import InvestmentTransactionDialog from '../desktop/investments/dialogs/InvestmentTransactionDialog.vue';
import PerformanceChartMobile from './components/PerformanceChartMobile.vue';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const investmentStore = useInvestmentStore();

// Reactive data
const loading = ref(false);
const showAddInvestmentDialog = ref(false);
const showEditInvestmentDialog = ref(false);
const showTransactionDialog = ref(false);
const selectedInvestment = ref<Investment | undefined>(undefined);

// Action menu state
const showActionMenu = ref(false);
const actionMenuActivator = ref<HTMLElement | null>(null);

const investments = computed(() => investmentStore.allInvestments);
const portfolioSummary = computed(() => investmentStore.portfolioSummary);

// Methods
const loadInvestments = async () => {
    loading.value = true;
    try {
        await investmentStore.loadAllInvestments();
    } catch (error) {
        console.error('Failed to load investments:', error);
    } finally {
        loading.value = false;
    }
};

const refreshPrices = async () => {
    loading.value = true;
    try {
        await loadInvestments();
    } finally {
        loading.value = false;
    }
};

const getAssetColor = (symbol: string) => {
    const colors = {
        'BTC': '#f7931a',
        'ETH': '#627eea',
        'AAPL': '#007aff',
        'NVDA': '#76b900',
        'TSLA': '#cc0000'
    };
    return colors[symbol as keyof typeof colors] || '#666666';
};

const getAssetIcon = (symbol: string) => {
    // Return first 1-2 characters for icon
    if (symbol.length <= 3) return symbol;
    return symbol.substring(0, 2);
};

const viewInvestmentDetails = (investment: Investment) => {
    selectedInvestment.value = investment;
    showEditInvestmentDialog.value = true;
};

const openActionMenu = (investment: Investment, event: Event) => {
    selectedInvestment.value = investment;
    actionMenuActivator.value = event.target as HTMLElement;
    showActionMenu.value = true;
};

const editInvestment = (investment: Investment) => {
    selectedInvestment.value = investment;
    showEditInvestmentDialog.value = true;
    showActionMenu.value = false;
};

const addTransaction = (investment: Investment) => {
    selectedInvestment.value = investment;
    showTransactionDialog.value = true;
    showActionMenu.value = false;
};

const deleteInvestment = (investment: Investment) => {
    console.log('Delete investment:', investment);
    showActionMenu.value = false;
};

const onInvestmentAdded = () => {
    // Investment already added to store
};

const onInvestmentUpdated = () => {
    loadInvestments();
};

const onTransactionAdded = () => {
    loadInvestments();
};

// Lifecycle
onMounted(() => {
    loadInvestments();
});
</script>

<style scoped>
.investments-mobile {
    min-height: 100vh;
    background-color: rgb(var(--v-theme-background));
}

.investment-cards .v-card {
    transition: transform 0.2s ease-in-out;
}

.investment-cards .v-card:active {
    transform: scale(0.98);
}

.investment-icon {
    flex-shrink: 0;
}
</style>