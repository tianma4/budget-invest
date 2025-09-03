<template>
    <v-row class="match-height">
        <!-- FIRE Progress Card -->
        <v-col cols="12" lg="6">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon :icon="mdiFireStation" class="me-2" color="orange" />
                    <span>{{ tt('FIRE Progress') }}</span>
                </v-card-title>
                <v-card-text>
                    <div class="mb-4">
                        <div class="d-flex justify-space-between align-center mb-2">
                            <span class="text-h6">{{ tt('Years to FIRE') }}</span>
                            <span class="text-h4 font-weight-bold" :class="fireMetrics.onTrackToRetirement ? 'text-success' : 'text-warning'">
                                {{ fireMetrics.yearsToRetirement.toFixed(1) }}
                            </span>
                        </div>
                        <v-progress-linear 
                            :model-value="(fireMetrics.currentNetWorth / fireMetrics.targetFIRENumber) * 100"
                            color="success"
                            height="8"
                            rounded
                        />
                        <div class="d-flex justify-space-between text-caption mt-1">
                            <span>Current: {{ formatCurrency(fireMetrics.currentNetWorth) }}</span>
                            <span class="d-flex align-center">
                                Target: {{ formatCurrency(fireMetrics.targetFIRENumber) }}
                                <v-btn 
                                    size="x-small" 
                                    variant="text" 
                                    :icon="mdiPencil" 
                                    class="ms-1"
                                    @click="openSettingsDialog"
                                />
                            </span>
                        </div>
                    </div>

                    <v-row dense>
                        <v-col cols="6">
                            <div class="text-center pa-3 bg-surface rounded">
                                <div class="text-caption text-medium-emphasis">{{ tt('Current Age') }}</div>
                                <div class="text-h6">{{ fireMetrics.currentAge }}</div>
                            </div>
                        </v-col>
                        <v-col cols="6">
                            <div class="text-center pa-3 bg-surface rounded">
                                <div class="text-caption text-medium-emphasis">{{ tt('Target Age') }}</div>
                                <div class="text-h6">{{ fireMetrics.targetRetirementAge }}</div>
                            </div>
                        </v-col>
                        <v-col cols="6">
                            <div class="text-center pa-3 bg-surface rounded">
                                <div class="text-caption text-medium-emphasis">{{ tt('Savings Rate') }}</div>
                                <div class="text-h6 font-weight-bold" :class="fireMetrics.savingsRate >= 20 ? 'text-success' : 'text-warning'">
                                    {{ fireMetrics.savingsRate.toFixed(1) }}%
                                </div>
                            </div>
                        </v-col>
                        <v-col cols="6">
                            <div class="text-center pa-3 bg-surface rounded">
                                <div class="text-caption text-medium-emphasis">{{ tt('Monthly Savings') }}</div>
                                <div class="text-h6">{{ formatCurrency(fireMetrics.monthlySavings) }}</div>
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Budget to Investment Flow -->
        <v-col cols="12" lg="6">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon :icon="mdiSwapHorizontalBold" class="me-2" color="primary" />
                    <span>{{ tt('Budget → Investment Flow') }}</span>
                </v-card-title>
                <v-card-text>
                    <div class="mb-4">
                        <div class="d-flex justify-space-between align-center mb-2">
                            <span>{{ tt('Monthly Surplus') }}</span>
                            <span class="font-weight-bold">{{ formatCurrency(budgetFlow.monthlyBudgetSurplus) }}</span>
                        </div>
                        
                        <div class="d-flex justify-space-between align-center mb-2">
                            <span>{{ tt('→ Emergency Fund') }}</span>
                            <span>{{ formatCurrency(50000) }}</span>
                        </div>
                        
                        <div class="d-flex justify-space-between align-center mb-3">
                            <span>{{ tt('→ Investments') }}</span>
                            <span class="font-weight-bold text-primary">{{ formatCurrency(budgetFlow.monthlyInvestmentContribution) }}</span>
                        </div>

                        <v-divider class="mb-3" />

                        <!-- Emergency Fund Status -->
                        <div class="mb-3">
                            <div class="d-flex justify-space-between align-center mb-1">
                                <span class="text-subtitle-2">{{ tt('Emergency Fund') }}</span>
                                <span class="text-caption">{{ budgetFlow.emergencyFundMonths.toFixed(1) }} {{ tt('months') }}</span>
                            </div>
                            <v-progress-linear
                                :model-value="(budgetFlow.emergencyFundCurrent / budgetFlow.emergencyFundTarget) * 100"
                                color="info"
                                height="6"
                                rounded
                            />
                            <div class="d-flex justify-space-between text-caption mt-1">
                                <span>{{ formatCurrency(budgetFlow.emergencyFundCurrent) }}</span>
                                <span>{{ formatCurrency(budgetFlow.emergencyFundTarget) }}</span>
                            </div>
                        </div>

                        <v-alert 
                            v-if="budgetFlow.emergencyFundCurrent < budgetFlow.emergencyFundTarget"
                            type="warning" 
                            density="compact"
                            class="mb-3"
                        >
                            Complete emergency fund before aggressive investing
                        </v-alert>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Retirement Projection Chart -->
        <v-col cols="12">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon :icon="mdiTrendingUp" class="me-2" color="success" />
                    <span>{{ tt('Retirement Projection') }}</span>
                </v-card-title>
                <v-card-text>
                    <div style="height: 400px; position: relative;">
                        <svg width="100%" height="100%" class="retirement-chart">
                            <!-- Chart Grid -->
                            <defs>
                                <pattern id="retirementGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#retirementGrid)" />
                            
                            <!-- Retirement Timeline Line -->
                            <path 
                                :d="retirementChartPath" 
                                fill="none" 
                                stroke="#4CAF50" 
                                stroke-width="3"
                            />
                            
                            <!-- FIRE Target Line -->
                            <line 
                                :x1="chartPadding" 
                                :x2="chartWidth - chartPadding"
                                :y1="fireTargetY" 
                                :y2="fireTargetY"
                                stroke="#FF9800" 
                                stroke-width="2" 
                                stroke-dasharray="5,5"
                            />
                            
                            <!-- Age markers -->
                            <g v-for="(projection, index) in displayedProjections" :key="index">
                                <text 
                                    :x="chartPadding + (index / (displayedProjections.length - 1)) * (chartWidth - 2 * chartPadding)"
                                    :y="chartHeight - 10"
                                    text-anchor="middle"
                                    font-size="12"
                                    fill="currentColor"
                                    v-if="projection.age % 5 === 0"
                                >
                                    {{ projection.age }}
                                </text>
                            </g>
                        </svg>
                        
                        <!-- Chart Legend -->
                        <div class="position-absolute" style="top: 20px; right: 20px;">
                            <v-chip size="small" color="success" class="me-2">
                                <v-icon :icon="mdiTrendingUp" size="12" class="me-1" />
                                Portfolio Growth
                            </v-chip>
                            <v-chip size="small" color="warning">
                                <v-icon :icon="mdiFlag" size="12" class="me-1" />
                                FIRE Target
                            </v-chip>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Financial Goals -->
        <v-col cols="12" md="6">
            <v-card>
                <v-card-title class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                        <v-icon :icon="mdiTargetVariant" class="me-2" color="primary" />
                        <span>{{ tt('Financial Goals') }}</span>
                    </div>
                    <v-btn size="small" variant="text" :prepend-icon="mdiPlus" @click="showAddGoalDialog = true">
                        {{ tt('Add Goal') }}
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <div v-for="goal in goals" :key="goal.goalId" class="mb-4">
                        <div class="d-flex justify-space-between align-center mb-2">
                            <span class="font-weight-medium">{{ goal.title }}</span>
                            <v-chip 
                                :color="goal.onTrack ? 'success' : 'warning'" 
                                size="small"
                                variant="tonal"
                            >
                                {{ goal.onTrack ? 'On Track' : 'Behind' }}
                            </v-chip>
                        </div>
                        <v-progress-linear
                            :model-value="goal.progress"
                            :color="goal.onTrack ? 'success' : 'warning'"
                            height="8"
                            rounded
                        />
                        <div class="d-flex justify-space-between text-caption mt-1">
                            <span>{{ formatCurrency(goal.currentAmount) }}</span>
                            <span>{{ formatCurrency(goal.targetAmount) }}</span>
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            Target: {{ formatDate(goal.targetDate) }} | 
                            {{ formatCurrency(goal.monthlyContribution) }}/month
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Optimization Suggestions -->
        <v-col cols="12" md="6">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon :icon="mdiLightbulbOnOutline" class="me-2" color="warning" />
                    <span>{{ tt('Optimization Tips') }}</span>
                </v-card-title>
                <v-card-text>
                    <v-alert
                        v-for="suggestion in optimizationSuggestions"
                        :key="suggestion.type"
                        :type="suggestion.impact === 'Critical' ? 'error' : suggestion.impact === 'High' ? 'warning' : 'info'"
                        density="compact"
                        class="mb-3"
                    >
                        <div class="font-weight-bold">{{ suggestion.title }}</div>
                        <div class="text-body-2">{{ suggestion.description }}</div>
                    </v-alert>

                    <div v-if="optimizationSuggestions.length === 0" class="text-center py-4">
                        <v-icon :icon="mdiCheckCircleOutline" size="48" color="success" class="mb-2" />
                        <div class="text-subtitle-1">{{ tt('Great job!') }}</div>
                        <div class="text-body-2 text-medium-emphasis">{{ tt('Your financial plan looks solid') }}</div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <!-- Add Goal Dialog -->
    <v-dialog v-model="showAddGoalDialog" max-width="500px">
        <v-card>
            <v-card-title>
                <span class="text-h5">{{ tt('Add Financial Goal') }}</span>
            </v-card-title>
            <v-card-text>
                <v-form @submit.prevent="addNewGoal">
                    <v-text-field
                        v-model="newGoal.title"
                        :label="tt('Goal Title')"
                        :rules="[v => !!v || 'Goal title is required']"
                        class="mb-3"
                    />
                    
                    <v-text-field
                        v-model="newGoal.targetAmount"
                        :label="tt('Target Amount')"
                        type="number"
                        step="0.01"
                        :rules="[v => !!v || 'Target amount is required', v => v > 0 || 'Amount must be positive']"
                        class="mb-3"
                    />
                    
                    <v-text-field
                        v-model="newGoal.currentAmount"
                        :label="tt('Current Amount')"
                        type="number"
                        step="0.01"
                        :rules="[v => v >= 0 || 'Amount cannot be negative']"
                        class="mb-3"
                    />
                    
                    <v-text-field
                        v-model="newGoal.targetDate"
                        :label="tt('Target Date')"
                        type="date"
                        :rules="[v => !!v || 'Target date is required']"
                        class="mb-3"
                    />
                    
                    <v-text-field
                        v-model="newGoal.monthlyContribution"
                        :label="tt('Monthly Contribution')"
                        type="number"
                        step="0.01"
                        :rules="[v => v >= 0 || 'Amount cannot be negative']"
                        class="mb-3"
                    />
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn color="grey" variant="text" @click="showAddGoalDialog = false">
                    {{ tt('Cancel') }}
                </v-btn>
                <v-btn color="primary" variant="elevated" @click="addNewGoal">
                    {{ tt('Add Goal') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="600px">
        <v-card>
            <v-card-title>
                <span class="text-h5">{{ tt('Financial Planning Settings') }}</span>
            </v-card-title>
            <v-card-text>
                <v-form>
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.currentAge"
                                :label="tt('Current Age')"
                                type="number"
                                :rules="[v => !!v || 'Age is required', v => v > 0 && v < 120 || 'Invalid age']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.targetRetirementAge"
                                :label="tt('Target Retirement Age')"
                                type="number"
                                :rules="[v => !!v || 'Retirement age is required', v => v > editableSettings.currentAge || 'Must be after current age']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.monthlyIncome"
                                :label="tt('Monthly Income')"
                                type="number"
                                step="0.01"
                                :prefix="tt('$')"
                                :rules="[v => !!v || 'Income is required', v => v >= 0 || 'Income cannot be negative']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.monthlyExpenses"
                                :label="tt('Monthly Expenses')"
                                type="number"
                                step="0.01"
                                :prefix="tt('$')"
                                :rules="[v => !!v || 'Expenses are required', v => v >= 0 || 'Expenses cannot be negative']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.emergencyFundMonths"
                                :label="tt('Emergency Fund (Months)')"
                                type="number"
                                step="0.5"
                                :rules="[v => !!v || 'Emergency fund months is required', v => v >= 3 && v <= 12 || 'Between 3-12 months recommended']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.expectedAnnualReturn"
                                :label="tt('Expected Annual Return (%)')"
                                type="number"
                                step="0.1"
                                :suffix="tt('%')"
                                :rules="[v => !!v || 'Annual return is required', v => v >= 0 && v <= 20 || 'Return should be 0-20%']"
                                class="mb-3"
                            />
                        </v-col>
                    </v-row>
                    
                    <v-divider class="my-4" />
                    
                    <div class="text-subtitle-1 mb-3">{{ tt('FIRE Calculation') }}</div>
                    <v-alert type="info" density="compact" class="mb-3">
                        {{ tt('Target FIRE Number is calculated as 25x your annual expenses') }}
                        ({{ formatCurrency(parseFloat(editableSettings.monthlyExpenses) * 12 * 25 * 100) }})
                    </v-alert>
                    
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.safeWithdrawalRate"
                                :label="tt('Safe Withdrawal Rate (%)')"
                                type="number"
                                step="0.1"
                                :suffix="tt('%')"
                                :rules="[v => !!v || 'Withdrawal rate is required', v => v >= 2 && v <= 6 || 'Rate should be 2-6%']"
                                class="mb-3"
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="editableSettings.inflationRate"
                                :label="tt('Inflation Rate (%)')"
                                type="number"
                                step="0.1"
                                :suffix="tt('%')"
                                :rules="[v => !!v || 'Inflation rate is required', v => v >= 0 && v <= 10 || 'Rate should be 0-10%']"
                                class="mb-3"
                            />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn color="grey" variant="text" @click="cancelSettings">
                    {{ tt('Cancel') }}
                </v-btn>
                <v-btn color="primary" variant="elevated" @click="saveSettings">
                    {{ tt('Save Settings') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useFinancialPlanningStore } from '@/stores/financialPlanning.ts';
import {
    mdiFireStation,
    mdiSwapHorizontalBold,
    mdiTrendingUp,
    mdiTargetVariant,
    mdiPlus,
    mdiFlag,
    mdiLightbulbOnOutline,
    mdiCheckCircleOutline,
    mdiPencil
} from '@mdi/js';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const financialPlanningStore = useFinancialPlanningStore();

// Chart dimensions
const chartWidth = ref(800);
const chartHeight = 400;
const chartPadding = 60;

// Computed properties from store
const fireMetrics = computed(() => financialPlanningStore.fireMetrics);
const budgetFlow = computed(() => financialPlanningStore.budgetToInvestmentFlow);
const goals = computed(() => financialPlanningStore.goals);
const retirementProjections = computed(() => financialPlanningStore.retirementProjections);
const optimizationSuggestions = computed(() => financialPlanningStore.savingsOptimization);

// Add Goal dialog
const showAddGoalDialog = ref(false);
const newGoal = ref({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    monthlyContribution: '0'
});

// Settings dialog
const showSettingsDialog = ref(false);
const editableSettings = ref({
    currentAge: '',
    targetRetirementAge: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    emergencyFundMonths: '',
    expectedAnnualReturn: '',
    safeWithdrawalRate: '',
    inflationRate: ''
});

// Chart data (show every 2 years for readability)
const displayedProjections = computed(() => {
    return retirementProjections.value.filter((_, index) => index % 2 === 0).slice(0, 20);
});

// Chart path calculation
const retirementChartPath = computed(() => {
    if (displayedProjections.value.length === 0) return '';
    
    const values = displayedProjections.value.map(p => p.portfolioValue);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue;
    
    if (range === 0) return '';
    
    const points = displayedProjections.value.map((projection, index) => {
        const x = chartPadding + (index / (displayedProjections.value.length - 1)) * (chartWidth.value - 2 * chartPadding);
        const y = chartHeight - chartPadding - ((projection.portfolioValue - minValue) / range) * (chartHeight - 2 * chartPadding);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
});

// FIRE target line Y position
const fireTargetY = computed(() => {
    const values = displayedProjections.value.map(p => p.portfolioValue);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue;
    
    if (range === 0) return chartHeight / 2;
    
    const targetValue = fireMetrics.value.targetFIRENumber;
    return chartHeight - chartPadding - ((targetValue - minValue) / range) * (chartHeight - 2 * chartPadding);
});

// Initialize settings with current values
const initializeSettings = () => {
    const profile = financialPlanningStore.userProfile;
    editableSettings.value = {
        currentAge: profile.currentAge.toString(),
        targetRetirementAge: profile.targetRetirementAge.toString(),
        monthlyIncome: (profile.monthlyIncome / 100).toString(), // Convert from cents
        monthlyExpenses: (profile.monthlyExpenses / 100).toString(), // Convert from cents
        emergencyFundMonths: profile.emergencyFundMonths.toString(),
        expectedAnnualReturn: (profile.expectedAnnualReturn * 100).toString(), // Convert to percentage
        safeWithdrawalRate: (profile.safeWithdrawalRate * 100).toString(), // Convert to percentage
        inflationRate: (profile.inflationRate * 100).toString() // Convert to percentage
    };
};

// Save settings function
const saveSettings = () => {
    financialPlanningStore.updateUserProfile({
        currentAge: parseInt(editableSettings.value.currentAge),
        targetRetirementAge: parseInt(editableSettings.value.targetRetirementAge),
        monthlyIncome: parseFloat(editableSettings.value.monthlyIncome) * 100, // Convert to cents
        monthlyExpenses: parseFloat(editableSettings.value.monthlyExpenses) * 100, // Convert to cents
        emergencyFundMonths: parseFloat(editableSettings.value.emergencyFundMonths),
        expectedAnnualReturn: parseFloat(editableSettings.value.expectedAnnualReturn) / 100, // Convert from percentage
        safeWithdrawalRate: parseFloat(editableSettings.value.safeWithdrawalRate) / 100, // Convert from percentage
        inflationRate: parseFloat(editableSettings.value.inflationRate) / 100 // Convert from percentage
    });
    showSettingsDialog.value = false;
};

// Cancel settings function
const cancelSettings = () => {
    showSettingsDialog.value = false;
    initializeSettings(); // Reset to original values
};

// Add goal function
const addNewGoal = () => {
    if (!newGoal.value.title || !newGoal.value.targetAmount || !newGoal.value.targetDate) {
        return;
    }
    
    financialPlanningStore.addGoal({
        title: newGoal.value.title,
        targetAmount: parseFloat(newGoal.value.targetAmount) * 100, // Convert to cents
        currentAmount: parseFloat(newGoal.value.currentAmount || '0') * 100, // Convert to cents
        targetDate: new Date(newGoal.value.targetDate),
        monthlyContribution: parseFloat(newGoal.value.monthlyContribution || '0') * 100 // Convert to cents
    });
    
    // Reset form
    newGoal.value = {
        title: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        monthlyContribution: '0'
    };
    
    showAddGoalDialog.value = false;
};

// Open settings dialog
const openSettingsDialog = () => {
    initializeSettings();
    showSettingsDialog.value = true;
};

// Helper functions
const formatCurrency = (amount: number) => {
    return formatAmountToLocalizedNumeralsWithCurrency(amount, 'USD');
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString();
};

// Set chart width on mount
onMounted(() => {
    const container = document.querySelector('.retirement-chart')?.parentElement;
    if (container) {
        chartWidth.value = container.clientWidth - 48; // Account for padding
    }
});
</script>

<style scoped>
.match-height {
    height: 100%;
}

.retirement-chart {
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 4px;
}
</style>