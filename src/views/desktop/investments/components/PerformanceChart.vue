<template>
    <v-card>
        <v-card-text class="pa-0">
            <!-- Performance Summary Header -->
            <div class="px-6 py-4 border-b">
                <div class="d-flex align-center justify-space-between mb-3">
                    <h6 class="text-h6 font-weight-bold">{{ tt('Portfolio Performance') }}</h6>
                    
                    <!-- Time Period Selector -->
                    <v-chip-group
                        v-model="selectedPeriodIndex" 
                        selected-class="text-primary"
                        mandatory
                        @update:model-value="onPeriodChange"
                    >
                        <v-chip 
                            v-for="(period, index) in timePeriods" 
                            :key="period.value"
                            :value="index"
                            size="small"
                            variant="outlined"
                        >
                            {{ period.label }}
                        </v-chip>
                    </v-chip-group>
                </div>
                
                <div class="d-flex align-center">
                    <div class="me-8">
                        <div class="text-body-2 text-medium-emphasis">{{ tt('Period Return') }}</div>
                        <div class="text-h6 font-weight-bold" 
                             :class="performanceSummary.periodGainLoss >= 0 ? 'text-success' : 'text-error'">
                            {{ performanceSummary.periodGainLossDisplay }}
                            <span class="text-body-2 ms-1">
                                ({{ performanceSummary.periodGainLoss >= 0 ? '+' : '' }}{{ performanceSummary.periodGainLossPct.toFixed(2) }}%)
                            </span>
                        </div>
                    </div>
                    
                    <div class="me-8">
                        <div class="text-body-2 text-medium-emphasis">{{ tt('Period Start') }}</div>
                        <div class="text-subtitle-1">{{ formatCurrency(performanceSummary.periodStartValue) }}</div>
                    </div>
                    
                    <div>
                        <div class="text-body-2 text-medium-emphasis">{{ tt('Period End') }}</div>
                        <div class="text-subtitle-1">{{ formatCurrency(performanceSummary.periodEndValue) }}</div>
                    </div>
                </div>
            </div>

            <!-- Chart Area -->
            <div class="px-6 py-4" v-if="chartData.length > 0">
                <div class="position-relative" style="height: 300px;">
                    <svg 
                        :width="chartWidth" 
                        :height="chartHeight" 
                        class="performance-chart"
                        @mousemove="onChartMouseMove"
                        @mouseleave="hideTooltip"
                    >
                        <!-- Chart Background Grid -->
                        <g class="chart-grid">
                            <defs>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </g>
                        
                        <!-- Zero Line -->
                        <line 
                            v-if="showZeroLine"
                            :x1="chartPadding" 
                            :x2="chartWidth - chartPadding"
                            :y1="zeroLineY" 
                            :y2="zeroLineY"
                            stroke="rgba(0,0,0,0.3)" 
                            stroke-width="1" 
                            stroke-dasharray="5,5"
                        />
                        
                        <!-- Performance Line -->
                        <path 
                            :d="linePath" 
                            fill="none" 
                            :stroke="lineColor" 
                            stroke-width="2"
                            class="performance-line"
                        />
                        
                        <!-- Area Fill (optional gradient) -->
                        <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" :stop-color="lineColor" stop-opacity="0.2"/>
                                <stop offset="100%" :stop-color="lineColor" stop-opacity="0.0"/>
                            </linearGradient>
                        </defs>
                        <path 
                            :d="areaPath" 
                            fill="url(#areaGradient)"
                        />
                        
                        <!-- Hover Indicator -->
                        <g v-if="hoveredPoint">
                            <line 
                                :x1="hoveredPoint.x" 
                                :x2="hoveredPoint.x"
                                :y1="chartPadding" 
                                :y2="chartHeight - chartPadding"
                                stroke="rgba(0,0,0,0.3)" 
                                stroke-width="1"
                            />
                            <circle 
                                :cx="hoveredPoint.x" 
                                :cy="hoveredPoint.y"
                                r="4" 
                                :fill="lineColor" 
                                stroke="white" 
                                stroke-width="2"
                            />
                        </g>
                    </svg>
                    
                    <!-- Tooltip -->
                    <div 
                        v-if="hoveredPoint && tooltip"
                        class="chart-tooltip"
                        :style="{
                            left: tooltipX + 'px',
                            top: tooltipY + 'px'
                        }"
                    >
                        <div class="text-caption">{{ tooltip.date }}</div>
                        <div class="text-body-2 font-weight-bold">{{ tooltip.value }}</div>
                        <div class="text-caption" :class="tooltip.gainLoss >= 0 ? 'text-success' : 'text-error'">
                            {{ tooltip.gainLoss >= 0 ? '+' : '' }}{{ tooltip.gainLossPct.toFixed(2) }}%
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- No Data State -->
            <div v-else class="pa-8 text-center">
                <v-icon icon="mdi-chart-line-variant" size="64" class="text-medium-emphasis mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">{{ tt('No Performance Data') }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ tt('Add investments to see portfolio performance') }}</div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useInvestmentStore } from '@/stores/investment.ts';
import type { TimePeriod } from '@/stores/investment.ts';

const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
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

// Chart dimensions
const chartWidth = ref(800);
const chartHeight = ref(300);
const chartPadding = 40;

// Selected period
const selectedPeriodIndex = ref(2); // Default to 1M

// Hover state
const hoveredPoint = ref<{ x: number, y: number, data: { timestamp: number, value: number, gainLoss: number, gainLossPct: number } } | null>(null);
const tooltip = ref<{ date: string, value: string, gainLoss: number, gainLossPct: number } | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

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
    if (range === 0) return chartHeight.value / 2;
    return chartHeight.value - chartPadding - ((0 - dataRange.value.min) / range) * (chartHeight.value - 2 * chartPadding);
});

const linePath = computed(() => {
    if (chartData.value.length === 0) return '';
    
    const range = dataRange.value.max - dataRange.value.min;
    if (range === 0) return '';
    
    const points = chartData.value.map((point, index) => {
        const x = chartPadding + (index / (chartData.value.length - 1)) * (chartWidth.value - 2 * chartPadding);
        const y = chartHeight.value - chartPadding - ((point.gainLossPct - dataRange.value.min) / range) * (chartHeight.value - 2 * chartPadding);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
});

const areaPath = computed(() => {
    if (chartData.value.length === 0) return '';
    
    const baseY = showZeroLine.value ? zeroLineY.value : chartHeight.value - chartPadding;
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

const onChartMouseMove = (event: MouseEvent) => {
    if (chartData.value.length === 0) return;
    
    const rect = (event.target as SVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Find closest data point
    const dataX = (x - chartPadding) / (chartWidth.value - 2 * chartPadding);
    const dataIndex = Math.round(dataX * (chartData.value.length - 1));
    
    if (dataIndex >= 0 && dataIndex < chartData.value.length) {
        const dataPoint = chartData.value[dataIndex];
        const range = dataRange.value.max - dataRange.value.min;
        
        const pointX = chartPadding + (dataIndex / (chartData.value.length - 1)) * (chartWidth.value - 2 * chartPadding);
        const pointY = range === 0 ? chartHeight.value / 2 : 
            chartHeight.value - chartPadding - ((dataPoint.gainLossPct - dataRange.value.min) / range) * (chartHeight.value - 2 * chartPadding);
        
        hoveredPoint.value = { x: pointX, y: pointY, data: dataPoint };
        
        tooltip.value = {
            date: new Date(dataPoint.timestamp).toLocaleDateString(),
            value: formatCurrency(dataPoint.value),
            gainLoss: dataPoint.gainLoss,
            gainLossPct: dataPoint.gainLossPct
        };
        
        tooltipX.value = Math.min(pointX + 10, chartWidth.value - 150);
        tooltipY.value = Math.max(pointY - 10, 0);
    }
};

const hideTooltip = () => {
    hoveredPoint.value = null;
    tooltip.value = null;
};

const formatCurrency = (amount: number) => {
    return formatAmountToLocalizedNumeralsWithCurrency(amount, 'USD');
};

// Lifecycle
onMounted(() => {
    nextTick(() => {
        // Set chart width based on container
        const container = document.querySelector('.performance-chart')?.parentElement;
        if (container) {
            chartWidth.value = container.clientWidth;
        }
    });
});
</script>

<style scoped>
.performance-chart {
    cursor: crosshair;
}

.performance-line {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.chart-tooltip {
    position: absolute;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10;
    min-width: 120px;
}

.chart-grid line {
    opacity: 0.3;
}
</style>