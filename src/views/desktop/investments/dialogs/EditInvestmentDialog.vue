<template>
    <v-dialog 
        :model-value="show" 
        @update:model-value="$emit('update:show', $event)"
        max-width="600px"
        persistent
    >
        <v-card v-if="investment">
            <v-card-title class="text-h5">{{ tt('Edit Investment') }}</v-card-title>
            
            <v-card-text>
                <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.tickerSymbol"
                                :label="tt('Ticker Symbol')"
                                variant="outlined"
                                readonly
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
                    
                    <v-alert type="info" variant="tonal" class="mb-4">
                        {{ tt('Note: To change the number of shares, use the Buy/Sell transaction feature instead.') }}
                    </v-alert>
                    
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                :model-value="investment.sharesOwned"
                                :label="tt('Current Shares')"
                                variant="outlined"
                                readonly
                                :suffix="tt('shares')"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                :model-value="formatAmountWithCurrency(investment.avgCostPerShare, investment.currency)"
                                :label="tt('Average Cost per Share')"
                                variant="outlined"
                                readonly
                            />
                        </v-col>
                    </v-row>
                    
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                :model-value="formatAmountWithCurrency(investment.totalInvested, investment.currency)"
                                :label="tt('Total Invested')"
                                variant="outlined"
                                readonly
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                :model-value="formatAmountWithCurrency(investment.currentValue, investment.currency)"
                                :label="tt('Current Value')"
                                variant="outlined"
                                readonly
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
                    {{ tt('Save Changes') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { formatAmountWithCurrency } from '@/lib/numeral.ts';

interface Props {
    show: boolean;
    investment?: any;
}

interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { tt } = useI18n();

// Form data
const form = ref();
const valid = ref(false);
const submitting = ref(false);

const formData = ref({
    tickerSymbol: '',
    companyName: '',
    comment: ''
});

// Validation rules
const commentRules = [
    (v: string) => !v || v.length <= 255 || tt('Notes must be 255 characters or less')
];

// Methods
const onSubmit = async () => {
    if (!valid.value || !props.investment) return;
    
    submitting.value = true;
    try {
        // TODO: Replace with actual API call
        // await investmentApi.update(props.investment.investmentId, {
        //     comment: formData.value.comment
        // });
        
        // Mock success
        console.log('Updating investment:', props.investment.investmentId, formData.value);
        
        emit('updated');
        emit('update:show', false);
    } catch (error) {
        console.error('Failed to update investment:', error);
        // TODO: Show error message
    } finally {
        submitting.value = false;
    }
};

const populateForm = () => {
    if (props.investment) {
        formData.value = {
            tickerSymbol: props.investment.tickerSymbol,
            companyName: props.investment.companyName || '',
            comment: props.investment.comment || ''
        };
    }
};

// Watch for investment changes
watch(() => props.investment, () => {
    if (props.investment) {
        populateForm();
    }
}, { immediate: true });

// Watch for dialog close to reset validation
watch(() => props.show, (newValue) => {
    if (newValue && props.investment) {
        populateForm();
    }
    if (form.value && !newValue) {
        form.value.resetValidation();
    }
});
</script>

<style scoped>
/* Add any custom styles here */
</style>