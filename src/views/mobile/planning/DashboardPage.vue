<template>
    <f7-page>
        <f7-navbar :title="tt('Financial Planning')" :back-link="tt('Back')"></f7-navbar>

        <!-- FIRE Progress Card -->
        <f7-card class="margin-top">
            <f7-card-header class="display-block">
                <p class="no-margin">
                    <strong>{{ tt('FIRE Progress') }}</strong>
                </p>
                <p class="text-color-gray no-margin">
                    {{ tt('Financial Independence, Retire Early') }}
                </p>
            </f7-card-header>
            <f7-card-content>
                <div class="grid grid-cols-2 grid-gap">
                    <div>
                        <div class="text-color-gray">{{ tt('Current Age') }}</div>
                        <div class="text-bold">{{ fireMetrics.currentAge }}</div>
                    </div>
                    <div>
                        <div class="text-color-gray">{{ tt('Target Age') }}</div>
                        <div class="text-bold">{{ fireMetrics.targetRetirementAge }}</div>
                    </div>
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('Current Net Worth') }}</div>
                    <div class="text-bold">{{ formatAmountToLocalizedNumeralsWithCurrency(fireMetrics.currentNetWorth, 'USD') }}</div>
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('FIRE Target') }}</div>
                    <div class="text-bold">{{ formatAmountToLocalizedNumeralsWithCurrency(fireMetrics.targetFIRENumber, 'USD') }}</div>
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('Progress') }}</div>
                    <f7-progressbar 
                        :progress="(fireMetrics.currentNetWorth / fireMetrics.targetFIRENumber) * 100"
                        :color="fireMetrics.onTrackToRetirement ? 'green' : 'orange'"
                    />
                    <div class="text-align-center margin-top-half">
                        {{ ((fireMetrics.currentNetWorth / fireMetrics.targetFIRENumber) * 100).toFixed(1) }}%
                    </div>
                </div>
            </f7-card-content>
        </f7-card>

        <!-- Savings Rate Card -->
        <f7-card>
            <f7-card-header class="display-block">
                <p class="no-margin">
                    <strong>{{ tt('Monthly Budget Flow') }}</strong>
                </p>
            </f7-card-header>
            <f7-card-content>
                <div class="grid grid-cols-2 grid-gap">
                    <div>
                        <div class="text-color-gray">{{ tt('Monthly Income') }}</div>
                        <div class="text-bold text-color-green">
                            {{ formatAmountToLocalizedNumeralsWithCurrency(fireMetrics.monthlyIncome, 'USD') }}
                        </div>
                    </div>
                    <div>
                        <div class="text-color-gray">{{ tt('Monthly Expenses') }}</div>
                        <div class="text-bold text-color-red">
                            {{ formatAmountToLocalizedNumeralsWithCurrency(fireMetrics.monthlyExpenses, 'USD') }}
                        </div>
                    </div>
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('Monthly Savings') }}</div>
                    <div class="text-bold" :class="fireMetrics.monthlySavings > 0 ? 'text-color-blue' : 'text-color-red'">
                        {{ formatAmountToLocalizedNumeralsWithCurrency(fireMetrics.monthlySavings, 'USD') }}
                    </div>
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('Savings Rate') }}</div>
                    <div class="text-bold">{{ fireMetrics.savingsRate.toFixed(1) }}%</div>
                    <f7-progressbar 
                        :progress="Math.min(fireMetrics.savingsRate, 100)"
                        :color="fireMetrics.savingsRate >= 20 ? 'green' : fireMetrics.savingsRate >= 10 ? 'orange' : 'red'"
                    />
                </div>
            </f7-card-content>
        </f7-card>

        <!-- Investment Flow Card -->
        <f7-card>
            <f7-card-header class="display-block">
                <p class="no-margin">
                    <strong>{{ tt('Investment Allocation') }}</strong>
                </p>
            </f7-card-header>
            <f7-card-content>
                <div class="margin-bottom">
                    <div class="text-color-gray">{{ tt('Emergency Fund') }}</div>
                    <div class="display-flex justify-content-space-between align-items-center">
                        <div class="text-bold">
                            {{ formatAmountToLocalizedNumeralsWithCurrency(budgetToInvestmentFlow.emergencyFundCurrent, 'USD') }}
                        </div>
                        <div class="text-color-gray">
                            {{ budgetToInvestmentFlow.emergencyFundMonths.toFixed(1) }} {{ tt('months') }}
                        </div>
                    </div>
                    <f7-progressbar 
                        :progress="(budgetToInvestmentFlow.emergencyFundCurrent / budgetToInvestmentFlow.emergencyFundTarget) * 100"
                        color="blue"
                    />
                </div>
                <div class="margin-top">
                    <div class="text-color-gray">{{ tt('Monthly Investment') }}</div>
                    <div class="text-bold text-color-blue">
                        {{ formatAmountToLocalizedNumeralsWithCurrency(budgetToInvestmentFlow.monthlyInvestmentContribution, 'USD') }}
                    </div>
                    <div class="text-color-gray margin-top-half">
                        {{ budgetToInvestmentFlow.automaticInvestmentRate.toFixed(0) }}% {{ tt('of surplus') }}
                    </div>
                </div>
            </f7-card-content>
        </f7-card>

        <!-- Retirement Projection Card -->
        <f7-card>
            <f7-card-header class="display-block">
                <p class="no-margin">
                    <strong>{{ tt('Retirement Projection') }}</strong>
                </p>
            </f7-card-header>
            <f7-card-content>
                <div class="text-align-center margin-bottom">
                    <div class="text-color-gray">{{ tt('Projected FIRE Age') }}</div>
                    <div class="text-bold" style="font-size: 28px;" 
                         :class="fireMetrics.onTrackToRetirement ? 'text-color-green' : 'text-color-orange'">
                        {{ fireMetrics.projectedRetirementAge.toFixed(0) }}
                    </div>
                    <div class="text-color-gray margin-top-half">
                        {{ fireMetrics.onTrackToRetirement ? tt('On track!') : tt('Behind target') }}
                    </div>
                </div>
                
                <!-- Simple projection table for mobile -->
                <f7-list class="margin-top">
                    <f7-list-item 
                        v-for="projection in mobileProjections" 
                        :key="projection.year"
                        :title="`${tt('Age')} ${projection.age}`"
                        :after="formatAmountToLocalizedNumeralsWithCurrency(projection.portfolioValue, 'USD')"
                    >
                        <template #footer>
                            <div class="text-color-gray">
                                {{ tt('Monthly income') }}: {{ formatAmountToLocalizedNumeralsWithCurrency(projection.monthlyIncome, 'USD') }}
                            </div>
                        </template>
                    </f7-list-item>
                </f7-list>
            </f7-card-content>
        </f7-card>

        <!-- Optimization Suggestions -->
        <f7-card v-if="savingsOptimization.length > 0">
            <f7-card-header class="display-block">
                <p class="no-margin">
                    <strong>{{ tt('Optimization Suggestions') }}</strong>
                </p>
            </f7-card-header>
            <f7-card-content>
                <f7-list>
                    <f7-list-item 
                        v-for="suggestion in savingsOptimization" 
                        :key="suggestion.type"
                        :title="suggestion.title"
                        :text="suggestion.description"
                        :badge="suggestion.impact"
                        :badge-color="suggestion.impact === 'Critical' ? 'red' : suggestion.impact === 'High' ? 'orange' : 'blue'"
                    />
                </f7-list>
            </f7-card-content>
        </f7-card>
    </f7-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useFinancialPlanningStore } from '@/stores/financialPlanning.ts';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const financialPlanningStore = useFinancialPlanningStore();

const fireMetrics = computed(() => financialPlanningStore.fireMetrics);
const budgetToInvestmentFlow = computed(() => financialPlanningStore.budgetToInvestmentFlow);
const savingsOptimization = computed(() => financialPlanningStore.savingsOptimization);

// Show key milestone projections for mobile (every 5 years)
const mobileProjections = computed(() => {
    const projections = financialPlanningStore.retirementProjections;
    return projections.filter((p, index) => index % 5 === 0 || p.age === fireMetrics.value.targetRetirementAge).slice(0, 6);
});
</script>

<style scoped>
.grid {
    display: grid;
}

.grid-cols-2 {
    grid-template-columns: 1fr 1fr;
}

.grid-gap {
    gap: 16px;
}

.text-bold {
    font-weight: 600;
}

.text-color-gray {
    color: var(--f7-text-color-secondary);
}

.text-color-green {
    color: var(--f7-color-green);
}

.text-color-red {
    color: var(--f7-color-red);
}

.text-color-blue {
    color: var(--f7-color-blue);
}

.text-color-orange {
    color: var(--f7-color-orange);
}

.text-align-center {
    text-align: center;
}

.display-flex {
    display: flex;
}

.justify-content-space-between {
    justify-content: space-between;
}

.align-items-center {
    align-items: center;
}
</style>