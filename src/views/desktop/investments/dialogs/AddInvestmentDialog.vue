<template>
    <v-dialog 
        :model-value="show" 
        @update:model-value="$emit('update:show', $event)"
        max-width="600px"
        persistent
    >
        <v-card>
            <v-card-title class="text-h5">{{ tt('Add Investment') }}</v-card-title>
            
            <v-card-text>
                <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.tickerSymbol"
                                :label="tt('Ticker Symbol')"
                                :rules="tickerRules"
                                :loading="lookingUpTicker"
                                placeholder="e.g. AAPL, NVDA"
                                variant="outlined"
                                @blur="lookupStock"
                                required
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.companyName"
                                :label="tt('Company Name')"
                                variant="outlined"
                                readonly
                            />
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
                            <v-select
                                v-model="formData.currency"
                                :label="tt('Currency')"
                                :items="currencies"
                                item-title="name"
                                item-value="code"
                                variant="outlined"
                                required
                            />
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12">
                            <v-text-field
                                v-model="totalCostDisplay"
                                :label="tt('Total Cost')"
                                variant="outlined"
                                readonly
                                :prefix="formData.currency === 'USD' ? '$' : ''"
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
                    color="primary" 
                    variant="elevated"
                    :loading="submitting"
                    :disabled="!valid"
                    @click="onSubmit"
                >
                    {{ tt('Add Investment') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '@/locales/helpers.ts';

interface Props {
    show: boolean;
}

interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'added'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { tt } = useI18n();

// Form data
const form = ref();
const valid = ref(false);
const submitting = ref(false);
const lookingUpTicker = ref(false);

const formData = ref({
    tickerSymbol: '',
    companyName: '',
    shares: null as number | null,
    pricePerShare: null as number | null,
    fees: 0,
    currency: 'USD',
    comment: ''
});

// Computed
const totalCostDisplay = computed(() => {
    const shares = parseFloat(formData.value.shares as any) || 0;
    const price = parseFloat(formData.value.pricePerShare as any) || 0;
    const fees = parseFloat(formData.value.fees as any) || 0;
    const total = (shares * price) + fees;
    return total.toFixed(2);
});

// Validation rules
const tickerRules = [
    (v: string) => !!v || tt('Ticker symbol is required'),
    (v: string) => (v && v.length <= 10) || tt('Ticker symbol must be 10 characters or less'),
    (v: string) => /^[A-Z0-9.-]+$/i.test(v) || tt('Invalid ticker symbol format')
];

const sharesRules = [
    (v: number) => !!v || tt('Number of shares is required'),
    (v: number) => v > 0 || tt('Number of shares must be greater than 0')
];

const priceRules = [
    (v: number) => !!v || tt('Price per share is required'),
    (v: number) => v > 0 || tt('Price per share must be greater than 0')
];

const commentRules = [
    (v: string) => !v || v.length <= 255 || tt('Notes must be 255 characters or less')
];

// Mock currencies (replace with actual currency service)
const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' }
];

// Methods
const lookupStock = async () => {
    if (!formData.value.tickerSymbol) return;
    
    lookingUpTicker.value = true;
    try {
        // TODO: Replace with actual API call
        // const response = await stockApi.lookup(formData.value.tickerSymbol);
        // formData.value.companyName = response.companyName;
        // formData.value.pricePerShare = response.currentPrice;
        
        // Mock lookup for now
        const mockData: { [key: string]: { name: string, price: number } } = {
            'AAPL': { name: 'Apple Inc.', price: 180.00 },
            'NVDA': { name: 'NVIDIA Corporation', price: 520.00 },
            'MSFT': { name: 'Microsoft Corporation', price: 420.00 },
            'GOOGL': { name: 'Alphabet Inc.', price: 140.00 },
            'TSLA': { name: 'Tesla, Inc.', price: 240.00 }
        };
        
        const ticker = formData.value.tickerSymbol.toUpperCase();
        if (mockData[ticker]) {
            formData.value.companyName = mockData[ticker].name;
            formData.value.pricePerShare = mockData[ticker].price;
        } else {
            formData.value.companyName = '';
            formData.value.pricePerShare = null;
        }
    } catch (error) {
        console.error('Failed to lookup stock:', error);
        formData.value.companyName = '';
        formData.value.pricePerShare = null;
    } finally {
        lookingUpTicker.value = false;
    }
};

const calculateTotal = () => {
    // Total is automatically calculated by computed property
};

const onSubmit = async () => {
    if (!valid.value) return;
    
    submitting.value = true;
    try {
        // TODO: Replace with actual API call
        // await investmentApi.create({
        //     tickerSymbol: formData.value.tickerSymbol.toUpperCase(),
        //     companyName: formData.value.companyName,
        //     shares: parseFloat(formData.value.shares as any),
        //     pricePerShare: parseFloat(formData.value.pricePerShare as any),
        //     fees: parseFloat(formData.value.fees as any) || 0,
        //     currency: formData.value.currency,
        //     comment: formData.value.comment
        // });
        
        // Mock success
        console.log('Creating investment:', formData.value);
        
        emit('added');
        emit('update:show', false);
        resetForm();
    } catch (error) {
        console.error('Failed to create investment:', error);
        // TODO: Show error message
    } finally {
        submitting.value = false;
    }
};

const resetForm = () => {
    formData.value = {
        tickerSymbol: '',
        companyName: '',
        shares: null,
        pricePerShare: null,
        fees: 0,
        currency: 'USD',
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
    }
});
</script>

<style scoped>
/* Add any custom styles here */
</style>