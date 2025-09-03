<template>
    <v-dialog 
        :model-value="show" 
        @update:model-value="$emit('update:show', $event)"
        max-width="600px"
        persistent
    >
        <v-card v-if="investment">
            <v-card-title class="text-h5">{{ tt('Buy/Sell Shares') }}</v-card-title>
            
            <v-card-text>
                <v-row class="mb-4">
                    <v-col cols="12">
                        <v-card variant="outlined">
                            <v-card-text>
                                <div class="text-h6">{{ investment.tickerSymbol }}</div>
                                <div class="text-body-2 text-medium-emphasis" v-if="investment.companyName">
                                    {{ investment.companyName }}
                                </div>
                                <div class="mt-2">
                                    <span class="text-body-2 text-medium-emphasis">{{ tt('Current Holdings:') }} </span>
                                    <span class="font-weight-bold">{{ investment.sharesOwned.toLocaleString() }} {{ tt('shares') }}</span>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
                
                <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
                    <v-row>
                        <v-col cols="12">
                            <v-btn-toggle
                                v-model="formData.transactionType"
                                color="primary"
                                variant="outlined"
                                divided
                                mandatory
                            >
                                <v-btn value="buy">
                                    <v-icon :icon="mdiTrendingUp" class="me-2" />
                                    {{ tt('Buy') }}
                                </v-btn>
                                <v-btn value="sell">
                                    <v-icon :icon="mdiTrendingDown" class="me-2" />
                                    {{ tt('Sell') }}
                                </v-btn>
                            </v-btn-toggle>
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.shares"
                                :label="tt('Number of Shares')"
                                :rules="sharesRules"
                                type="number"
                                step="0.0001"
                                min="0.0001"
                                variant="outlined"
                                @input="calculateTotal"
                                required
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.pricePerShare"
                                :label="tt('Price per Share')"
                                :rules="priceRules"
                                type="number"
                                step="0.01"
                                min="0.01"
                                variant="outlined"
                                @input="calculateTotal"
                                required
                            />
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.fees"
                                :label="tt('Transaction Fees')"
                                type="number"
                                step="0.01"
                                min="0"
                                variant="outlined"
                                @input="calculateTotal"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="totalAmountDisplay"
                                :label="tt('Total Amount')"
                                variant="outlined"
                                readonly
                                :prefix="investment.currency === 'USD' ? '$' : ''"
                            />
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-text-field
                                v-model="formData.transactionDate"
                                :label="tt('Transaction Date')"
                                type="date"
                                variant="outlined"
                                :max="new Date().toISOString().split('T')[0]"
                                required
                            />
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-textarea
                                v-model="formData.comment"
                                :label="tt('Notes')"
                                variant="outlined"
                                rows="3"
                                :counter="255"
                                :rules="commentRules"
                            />
                        </v-col>
                    </v-row>
                    
                    <v-alert 
                        v-if="formData.transactionType === 'sell' && formData.shares && formData.shares > investment.sharesOwned" 
                        type="warning" 
                        variant="tonal" 
                        class="mb-4"
                    >
                        {{ tt('Warning: You are selling more shares than you currently own.') }}
                    </v-alert>
                </v-form>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer />
                <v-btn 
                    variant="text" 
                    @click="$emit('update:show', false)"
                    :disabled="submitting"
                >
                    {{ tt('Cancel') }}
                </v-btn>
                <v-btn 
                    :color="formData.transactionType === 'buy' ? 'success' : 'error'" 
                    variant="elevated"
                    :loading="submitting"
                    :disabled="!valid"
                    @click="onSubmit"
                >
                    {{ formData.transactionType === 'buy' ? tt('Buy Shares') : tt('Sell Shares') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mdiTrendingUp, mdiTrendingDown } from '@mdi/js';
import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore } from '@/stores/investment.ts';

interface Props {
    show: boolean;
    investment?: {
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
    };
}

interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'added'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { tt } = useI18n();
const investmentStore = useInvestmentStore();

// Form data
const form = ref();
const valid = ref(false);
const submitting = ref(false);

const formData = ref({
    transactionType: 'buy',
    shares: null as number | null,
    pricePerShare: null as number | null,
    fees: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    comment: ''
});

// Computed
const totalAmountDisplay = computed(() => {
    const shares = parseFloat(String(formData.value.shares)) || 0;
    const price = parseFloat(String(formData.value.pricePerShare)) || 0;
    const fees = parseFloat(String(formData.value.fees)) || 0;
    const subtotal = shares * price;
    const total = formData.value.transactionType === 'buy' ? subtotal + fees : subtotal - fees;
    return total.toFixed(2);
});

// Validation rules
const sharesRules = computed(() => {
    const baseRules = [
        (v: number) => !!v || tt('Number of shares is required'),
        (v: number) => v > 0 || tt('Number of shares must be greater than 0')
    ];
    
    if (formData.value.transactionType === 'sell' && props.investment) {
        baseRules.push((v: number) => v <= (props.investment?.sharesOwned || 0) || tt('Cannot sell more shares than you own'));
    }
    
    return baseRules;
});

const priceRules = [
    (v: number) => !!v || tt('Price per share is required'),
    (v: number) => v > 0 || tt('Price per share must be greater than 0')
];

const commentRules = [
    (v: string) => !v || v.length <= 255 || tt('Notes must be 255 characters or less')
];

// Methods
const calculateTotal = () => {
    // Total is automatically calculated by computed property
};

const onSubmit = async () => {
    if (!valid.value || !props.investment) return;
    
    submitting.value = true;
    try {
        // Process the buy/sell transaction
        const shares = parseFloat(String(formData.value.shares));
        const pricePerShare = parseFloat(String(formData.value.pricePerShare));
        const fees = parseFloat(String(formData.value.fees)) || 0;
        const isBuy = formData.value.transactionType === 'buy';
        
        // Update the investment with the new transaction
        await investmentStore.updateInvestmentWithTransaction(props.investment.investmentId, {
            type: isBuy ? 'buy' : 'sell',
            shares: shares,
            pricePerShare: pricePerShare,
            fees: fees,
            transactionDate: new Date(formData.value.transactionDate),
            comment: formData.value.comment
        });
        
        emit('added');
        emit('update:show', false);
        resetForm();
    } catch (error) {
        console.error('Failed to create transaction:', error);
        // TODO: Show error message
    } finally {
        submitting.value = false;
    }
};

const resetForm = () => {
    formData.value = {
        transactionType: 'buy',
        shares: null,
        pricePerShare: null,
        fees: 0,
        transactionDate: new Date().toISOString().split('T')[0],
        comment: ''
    };
    if (form.value) {
        form.value.resetValidation();
    }
};

// Watch for dialog close to reset form
watch(() => props.show, (newValue) => {
    if (!newValue) {
        resetForm();
    } else if (props.investment) {
        // Pre-fill current price if available
        if (props.investment.currentPrice) {
            formData.value.pricePerShare = parseFloat((props.investment.currentPrice / 100).toFixed(2));
        }
    }
});
</script>

<style scoped>
/* Add any custom styles here */
</style>