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
                                    <div class="text-h6 font-weight-bold" 
                                         :class="portfolioSummary.totalGainLoss >= 0 ? 'text-success' : 'text-error'">
                                        {{ portfolioSummary.totalGainLossDisplay }} ({{ portfolioSummary.totalGainLossPct.toFixed(2) }}%)
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
                            <v-btn class="me-4" :disabled="loading" color="secondary" variant="tonal"
                                   @click="refreshPrices">
                                <v-icon :icon="mdiRefresh" class="me-2" />
                                {{ tt('Refresh Prices') }}
                            </v-btn>
                            <v-btn :disabled="loading" color="primary" variant="elevated"
                                   @click="showAddInvestmentDialog = true">
                                <v-icon :icon="mdiPlus" class="me-2" />
                                {{ tt('Add Investment') }}
                            </v-btn>
                        </div>

                        <div class="pa-6">
                            <v-data-table
                                :loading="loading"
                                :headers="headers"
                                :items="investments"
                                :items-per-page="25"
                                class="border"
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

// Import dialogs (will be created)
import AddInvestmentDialog from './dialogs/AddInvestmentDialog.vue';
import EditInvestmentDialog from './dialogs/EditInvestmentDialog.vue';
import InvestmentTransactionDialog from './dialogs/InvestmentTransactionDialog.vue';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const { mdAndDown } = useDisplay();

// Reactive data
const loading = ref(false);
const showNav = ref(true);
const alwaysShowNav = computed(() => !mdAndDown.value);

const showAddInvestmentDialog = ref(false);
const showEditInvestmentDialog = ref(false);
const showTransactionDialog = ref(false);
const selectedInvestment = ref<typeof investments.value[0] | undefined>(undefined);

const investments = ref<{
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
}[]>([]);
const portfolioSummary = ref({
    totalInvested: 0,
    currentValue: 0,
    totalGainLoss: 0,
    totalGainLossPct: 0,
    currency: 'USD',
    totalInvestedDisplay: '$0.00',
    currentValueDisplay: '$0.00',
    totalGainLossDisplay: '$0.00'
});

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
        // TODO: Replace with actual API call
        // const response = await investmentApi.getAll();
        // investments.value = response.investments;
        // portfolioSummary.value = response.summary;
        
        // Mock data for now
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
    } catch (error) {
        console.error('Failed to load investments:', error);
    } finally {
        loading.value = false;
    }
};

const updatePortfolioSummary = () => {
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
};

const refreshPrices = async () => {
    loading.value = true;
    try {
        // TODO: Call API to refresh prices
        await loadInvestments();
    } finally {
        loading.value = false;
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
    loadInvestments();
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
.match-height {
    height: 100%;
}
</style>