<template>
    <v-row class="match-height">
        <v-col cols="12">
            <v-card>
                <v-layout>
                    <v-navigation-drawer :permanent="alwaysShowNav" v-model="showNav">
                        <div class="mx-6 my-4">
                            <v-btn :disabled="loading" variant="elevated" color="primary" block
                                   @click="showAddInvestmentDialog = true">
                                <v-icon :icon="mdiPlus" class="me-2" />
                                {{ tt('Add Investment') }}
                            </v-btn>
                        </div>
                        <v-divider />
                        
                        <div class="mx-6 mt-4">
                            <span class="text-subtitle-2">{{ tt('Portfolio Summary') }}</span>
                            <v-card class="mt-2" variant="outlined">
                                <v-card-text>
                                    <div class="text-body-2 text-medium-emphasis mb-1">{{ tt('Total Invested') }}</div>
                                    <div class="text-h6 font-weight-bold mb-3">{{ portfolioSummary.totalInvestedDisplay }}</div>
                                    
                                    <div class="text-body-2 text-medium-emphasis mb-1">{{ tt('Current Value') }}</div>
                                    <div class="text-h6 font-weight-bold mb-3">{{ portfolioSummary.currentValueDisplay }}</div>
                                    
                                    <div class="text-body-2 text-medium-emphasis mb-1">{{ tt('Total P&L') }}</div>
                                    <div class="text-h6 font-weight-bold mb-3" 
                                         :class="portfolioSummary.totalGainLoss >= 0 ? 'text-success' : 'text-error'">
                                        {{ portfolioSummary.totalGainLossDisplay }} ({{ portfolioSummary.totalGainLossPct.toFixed(2) }}%)
                                    </div>
                                    
                                    <div class="text-caption text-medium-emphasis" v-if="lastPriceRefresh > 0">
                                        {{ tt('Last updated:') }} {{ formatLastRefreshTime(lastPriceRefresh) }}
                                        <v-icon v-if="isRefreshingPrices" size="14" class="ms-1 animate-spin">mdi-loading</v-icon>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-navigation-drawer>
                    
                    <v-main>
                        <div class="d-flex align-center px-6 pt-6">
                            <div>
                                <div class="d-flex align-center">
                                    <h4 class="text-h4 font-weight-bold">{{ tt('Investments') }}</h4>
                                    <v-btn class="ms-4 d-sm-none" density="comfortable" color="default" 
                                           :icon="showNav ? mdiChevronLeft : mdiMenu" variant="text"
                                           @click="showNav = !showNav" />
                                </div>
                                <span class="text-body-1 text-medium-emphasis">{{ tt('Manage your investment portfolio') }}</span>
                            </div>
                            <v-spacer />
                            <v-btn class="me-4" :disabled="loading || isRefreshingPrices" 
                                   color="secondary" variant="tonal"
                                   @click="refreshPrices">
                                <v-icon :icon="mdiRefresh" class="me-2" 
                                        :class="{ 'animate-spin': isRefreshingPrices }" />
                                {{ isRefreshingPrices ? tt('Refreshing...') : tt('Refresh Prices') }}
                            </v-btn>
                            <v-btn :disabled="loading" color="primary" variant="elevated"
                                   @click="showAddInvestmentDialog = true">
                                <v-icon :icon="mdiPlus" class="me-2" />
                                {{ tt('Add Investment') }}
                            </v-btn>
                        </div>

                        <!-- Performance Chart -->
                        <div class="px-6">
                            <performance-chart />
                        </div>

                        <div class="pa-6">
                            <v-data-table
                                :loading="loading"
                                :headers="headers"
                                :items="investments"
                                :items-per-page="10"
                                class="border"
                                hide-default-footer
                            >
                                <template #item.tickerSymbol="{ item }">
                                    <div class="d-flex align-center">
                                        <div>
                                            <div class="font-weight-bold">{{ item.tickerSymbol }}</div>
                                            <div class="text-caption text-medium-emphasis" v-if="item.companyName">{{ item.companyName }}</div>
                                        </div>
                                    </div>
                                </template>

                                <template #item.sharesOwned="{ item }">
                                    {{ item.sharesOwned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) }}
                                </template>

                                <template #item.avgCostPerShare="{ item }">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(item.avgCostPerShare, item.currency) }}
                                </template>

                                <template #item.currentPrice="{ item }">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(item.currentPrice, item.currency) }}
                                </template>

                                <template #item.totalInvested="{ item }">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(item.totalInvested, item.currency) }}
                                </template>

                                <template #item.currentValue="{ item }">
                                    {{ formatAmountToLocalizedNumeralsWithCurrency(item.currentValue, item.currency) }}
                                </template>

                                <template #item.gainLoss="{ item }">
                                    <div :class="item.gainLoss >= 0 ? 'text-success' : 'text-error'">
                                        {{ formatAmountToLocalizedNumeralsWithCurrency(item.gainLoss, item.currency) }}
                                        <div class="text-caption">{{ item.gainLossPct.toFixed(2) }}%</div>
                                    </div>
                                </template>

                                <template #item.actions="{ item }">
                                    <v-btn density="comfortable" color="default" variant="text" 
                                           :icon="mdiDotsVertical">
                                        <v-icon :icon="mdiDotsVertical" />
                                        <v-menu activator="parent">
                                            <v-list>
                                                <v-list-item @click="editInvestment(item)">
                                                    <v-list-item-title>{{ tt('Edit') }}</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click="addTransaction(item)">
                                                    <v-list-item-title>{{ tt('Buy/Sell') }}</v-list-item-title>
                                                </v-list-item>
                                                <v-divider />
                                                <v-list-item @click="deleteInvestment(item)" class="text-error">
                                                    <v-list-item-title>{{ tt('Delete') }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </div>
                    </v-main>
                </v-layout>
            </v-card>
        </v-col>
    </v-row>

    <!-- Add Investment Dialog -->
    <add-investment-dialog 
        :show="showAddInvestmentDialog"
        @update:show="showAddInvestmentDialog = $event"
        @added="onInvestmentAdded"
    />

    <!-- Edit Investment Dialog -->
    <edit-investment-dialog 
        :show="showEditInvestmentDialog"
        :investment="selectedInvestment"
        @update:show="showEditInvestmentDialog = $event"
        @updated="onInvestmentUpdated"
    />

    <!-- Transaction Dialog -->
    <investment-transaction-dialog 
        :show="showTransactionDialog"
        :investment="selectedInvestment"
        @update:show="showTransactionDialog = $event"
        @added="onTransactionAdded"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDisplay } from 'vuetify';

import {
    mdiPlus,
    mdiRefresh,
    mdiMenu,
    mdiChevronLeft,
    mdiDotsVertical
} from '@mdi/js';

import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore } from '@/stores/investment.ts';

// Import dialogs and components
import AddInvestmentDialog from './dialogs/AddInvestmentDialog.vue';
import EditInvestmentDialog from './dialogs/EditInvestmentDialog.vue';
import InvestmentTransactionDialog from './dialogs/InvestmentTransactionDialog.vue';
import PerformanceChart from './components/PerformanceChart.vue';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const { mdAndDown } = useDisplay();
const investmentStore = useInvestmentStore();

// Reactive data
const loading = ref(false);
const showNav = ref(true);
const alwaysShowNav = computed(() => !mdAndDown.value);

const showAddInvestmentDialog = ref(false);
const showEditInvestmentDialog = ref(false);
const showTransactionDialog = ref(false);
const selectedInvestment = ref<typeof investments.value[0] | undefined>(undefined);

const investments = computed(() => investmentStore.allInvestments);
const portfolioSummary = computed(() => investmentStore.portfolioSummary);
const isRefreshingPrices = computed(() => investmentStore.isRefreshingPrices);
const lastPriceRefresh = computed(() => investmentStore.lastPriceRefresh);

// Table headers
const headers = computed(() => [
    { title: tt('Ticker'), key: 'tickerSymbol', sortable: true },
    { title: tt('Shares'), key: 'sharesOwned', sortable: true, align: 'end' as const },
    { title: tt('Avg Cost'), key: 'avgCostPerShare', sortable: true, align: 'end' as const },
    { title: tt('Current Price'), key: 'currentPrice', sortable: true, align: 'end' as const },
    { title: tt('Total Invested'), key: 'totalInvested', sortable: true, align: 'end' as const },
    { title: tt('Current Value'), key: 'currentValue', sortable: true, align: 'end' as const },
    { title: tt('P&L'), key: 'gainLoss', sortable: true, align: 'end' as const },
    { title: tt('Actions'), key: 'actions', sortable: false, align: 'center' as const, width: 100 }
]);

// Methods
const loadInvestments = async () => {
    loading.value = true;
    try {
        // Load investments from store (localStorage temporarily, database eventually)
        await investmentStore.loadAllInvestments();
    } catch (error) {
        console.error('Failed to load investments:', error);
    } finally {
        loading.value = false;
    }
};


const refreshPrices = async () => {
    try {
        await investmentStore.refreshStockPrices(true); // Force refresh
    } catch (error) {
        console.error('Failed to refresh prices:', error);
        // TODO: Show error notification to user
    }
};

const formatLastRefreshTime = (timestamp: number): string => {
    if (timestamp === 0) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
        return tt('Just now');
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return tt('{0} minutes ago', minutes);
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return tt('{0} hours ago', hours);
    } else {
        return new Date(timestamp).toLocaleString();
    }
};

const editInvestment = (investment: typeof investments.value[0]) => {
    selectedInvestment.value = investment;
    showEditInvestmentDialog.value = true;
};

const addTransaction = (investment: typeof investments.value[0]) => {
    selectedInvestment.value = investment;
    showTransactionDialog.value = true;
};

const deleteInvestment = (investment: typeof investments.value[0]) => {
    // TODO: Show confirmation dialog and delete
    console.log('Delete investment:', investment);
};

const onInvestmentAdded = () => {
    // Refresh investments and portfolio summary after adding new investment
    loadInvestments();
};

const onInvestmentUpdated = () => {
    loadInvestments();
};

const onTransactionAdded = () => {
    // Store already reloads itself after transaction, no need to reload again
    // loadInvestments();
};

// Lifecycle
onMounted(async () => {
    await loadInvestments();
});
</script>

<style scoped>
.match-height {
    height: 100%;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>