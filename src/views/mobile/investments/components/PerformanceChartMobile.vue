<template>
    <v-card variant="outlined">
        <v-card-text class="pa-0">
            <!-- Performance Header -->
            <div class="px-4 py-3 border-b">
                <div class="d-flex align-center justify-space-between mb-2">
                    <h6 class="text-subtitle-1 font-weight-bold">{{ tt('Performance') }}</h6>
                    <!-- Compact Time Period Selector -->
                    <v-chip-group
                        v-model="selectedPeriodIndex" 
                        selected-class="text-primary"
                        mandatory
                        @update:model-value="onPeriodChange"
                        class="period-selector-mobile"
                    >
                        <v-chip 
                            v-for="(period, index) in timePeriods" 
                            :key="period.value"
                            :value="index"
                            size="x-small"
                            variant="outlined"
                            class="text-caption"
                        >
                            {{ period.label }}
                        </v-chip>
                    </v-chip-group>
                </div>
                
                <!-- Performance Summary -->
                <div class="d-flex align-center justify-space-between">
                    <div>
                        <div class="text-caption text-medium-emphasis">{{ tt('Period Return') }}</div>
                        <div class="text-body-1 font-weight-bold" 
                             :class="performanceSummary.periodGainLoss >= 0 ? 'text-success' : 'text-error'">
                            {{ performanceSummary.periodGainLossDisplay }}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="text-caption text-medium-emphasis">{{ tt('Percentage') }}</div>
                        <div class="text-body-1 font-weight-bold" 
                             :class="performanceSummary.periodGainLoss >= 0 ? 'text-success' : 'text-error'">
                            {{ performanceSummary.periodGainLoss >= 0 ? '+' : '' }}{{ performanceSummary.periodGainLossPct.toFixed(2) }}%
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mini Chart -->
            <div class="px-4 py-3" v-if="chartData.length > 0">
                <div class="position-relative" style="height: 120px;">
                    <svg 
                        :width="chartWidth" 
                        :height="120" 
                        class="performance-chart-mobile"
                    >
                        <!-- Simple Grid -->
                        <defs>
                            <pattern id="gridMobile" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridMobile)" />
                        
                        <!-- Zero Line -->
                        <line 
                            v-if="showZeroLine"
                            :x1="10" 
                            :x2="chartWidth - 10"
                            :y1="zeroLineY" 
                            :y2="zeroLineY"
                            stroke="rgba(0,0,0,0.2)" 
                            stroke-width="1" 
                            stroke-dasharray="2,2"
                        />
                        
                        <!-- Performance Line -->
                        <path 
                            :d="linePath" 
                            fill="none" 
                            :stroke="lineColor" 
                            stroke-width="2"
                        />
                        
                        <!-- Area Fill -->
                        <defs>
                            <linearGradient id="areaGradientMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" :stop-color="lineColor" stop-opacity="0.15"/>
                                <stop offset="100%" :stop-color="lineColor" stop-opacity="0.0"/>
                            </linearGradient>
                        </defs>
                        <path 
                            :d="areaPath" 
                            fill="url(#areaGradientMobile)"
                        />
                    </svg>
                </div>
            </div>
            
            <!-- No Data State -->
            <div v-else class="pa-6 text-center">
                <v-icon icon="mdi-chart-line" size="32" class="text-medium-emphasis mb-2" />
                <div class="text-body-2 text-medium-emphasis">{{ tt('No performance data') }}</div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore } from '@/stores/investment.ts';
import type { TimePeriod } from '@/stores/investment.ts';

const { tt } = useI18n();
const investmentStore = useInvestmentStore();

// Time period options
const timePeriods = [
    { label: '1D', value: '1d' as TimePeriod },
    { label: '1W', value: '1w' as TimePeriod },
    { label: '1M', value: '1m' as TimePeriod },
    { label: '3M', value: '1q' as TimePeriod },
    { label: '1Y', value: '1y' as TimePeriod },
    { label: '2Y', value: '2y' as TimePeriod }
];

// Chart dimensions - smaller for mobile
const chartWidth = ref(300);
const chartHeight = 120;
const chartPadding = 10;

// Selected period
const selectedPeriodIndex = ref(2); // Default to 1M

// Computed properties
const chartData = computed(() => investmentStore.currentPerformanceData);
const performanceSummary = computed(() => investmentStore.performanceSummary);

const lineColor = computed(() => {
    return performanceSummary.value.periodGainLoss >= 0 ? '#4CAF50' : '#F44336';
});

// Chart calculations
const dataRange = computed(() => {
    if (chartData.value.length === 0) return { min: 0, max: 0 };
    
    const values = chartData.value.map(d => d.gainLossPct);
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
});

const showZeroLine = computed(() => {
    return dataRange.value.min < 0 && dataRange.value.max > 0;
});

const zeroLineY = computed(() => {
    if (!showZeroLine.value) return 0;
    const range = dataRange.value.max - dataRange.value.min;
    if (range === 0) return chartHeight / 2;
    return chartHeight - chartPadding - ((0 - dataRange.value.min) / range) * (chartHeight - 2 * chartPadding);
});

const linePath = computed(() => {
    if (chartData.value.length === 0) return '';
    
    const range = dataRange.value.max - dataRange.value.min;
    if (range === 0) return '';
    
    const points = chartData.value.map((point, index) => {
        const x = chartPadding + (index / (chartData.value.length - 1)) * (chartWidth.value - 2 * chartPadding);
        const y = chartHeight - chartPadding - ((point.gainLossPct - dataRange.value.min) / range) * (chartHeight - 2 * chartPadding);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
});

const areaPath = computed(() => {
    if (chartData.value.length === 0) return '';
    
    const baseY = showZeroLine.value ? zeroLineY.value : chartHeight - chartPadding;
    const linePart = linePath.value;
    
    if (!linePart) return '';
    
    const lastX = chartPadding + (chartWidth.value - 2 * chartPadding);
    const firstX = chartPadding;
    
    return `${linePart} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
});

// Methods
const onPeriodChange = (index: number) => {
    if (index !== null && timePeriods[index]) {
        investmentStore.setTimePeriod(timePeriods[index].value);
    }
};

// Lifecycle
onMounted(() => {
    // Set chart width based on container
    const container = document.querySelector('.performance-chart-mobile')?.parentElement;
    if (container) {
        chartWidth.value = Math.min(container.clientWidth - 32, 350); // Max 350px
    }
});
</script>

<style scoped>
.period-selector-mobile {
    gap: 4px;
}

.period-selector-mobile .v-chip {
    min-width: 32px;
    height: 24px;
    font-size: 10px;
}

.performance-chart-mobile {
    width: 100%;
}
</style>