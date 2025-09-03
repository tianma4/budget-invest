<template>
    <v-chart autoresize class="monthly-category-chart-container" :option="chartOptions" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import type { CallbackDataParams } from 'echarts/types/dist/shared';

import { useI18n } from '@/locales/helpers.ts';
import { useUserStore } from '@/stores/user.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';

import { ThemeType } from '@/core/theme.ts';
import { CategoryType } from '@/core/category.ts';
import { DEFAULT_CHART_COLORS } from '@/consts/color.ts';

import { getDisplayColor } from '@/lib/color.ts';

interface CategorySpendingData {
    month: string;
    categoryId: string;
    categoryName: string;
    amount: number;
    color?: string;
}

interface MonthlyDataItem {
    categoryId: string;
    categoryName: string;
    months: Record<string, number>;
    color: string;
    total: number;
}

const props = defineProps<{
    data?: CategorySpendingData[];
    currency?: string;
    selectedCategories?: string[];
    dateRange?: {
        startMonth: string; // YYYY-MM format
        endMonth: string;   // YYYY-MM format
    };
}>();

const emit = defineEmits<{
    (e: 'categoryFilter', categories: string[]): void;
}>();

const theme = useTheme();
const userStore = useUserStore();
const categoriesStore = useTransactionCategoriesStore();

const {
    tt,
    formatAmountToLocalizedNumeralsWithCurrency
} = useI18n();

const selectedLegends = ref<Record<string, boolean>>({});

const isDarkMode = computed<boolean>(() => theme.global.name.value === ThemeType.Dark);

const categoryColorMap = computed<Record<string, string>>(() => {
    const colorMap: Record<string, string> = {};
    const categories = categoriesStore.allTransactionCategories[CategoryType.Expense] || [];
    
    categories.forEach((category, index) => {
        colorMap[category.id] = category.color || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
    });
    
    return colorMap;
});

const monthlyData = computed<MonthlyDataItem[]>(() => {
    if (!props.data || !props.data.length) return [];
    
    const categoryMap = new Map<string, MonthlyDataItem>();
    
    props.data.forEach((item) => {
        if (!categoryMap.has(item.categoryId)) {
            categoryMap.set(item.categoryId, {
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                months: {},
                color: categoryColorMap.value[item.categoryId] || DEFAULT_CHART_COLORS[0],
                total: 0
            });
        }
        
        const categoryData = categoryMap.get(item.categoryId)!;
        categoryData.months[item.month] = (categoryData.months[item.month] || 0) + item.amount;
        categoryData.total += item.amount;
    });
    
    return Array.from(categoryMap.values())
        .sort((a, b) => b.total - a.total); // Sort by total spending descending
});

const allMonths = computed<string[]>(() => {
    if (!props.dateRange) return [];
    
    const months: string[] = [];
    const start = new Date(props.dateRange.startMonth + '-01');
    const end = new Date(props.dateRange.endMonth + '-01');
    
    const current = new Date(start);
    while (current <= end) {
        months.push(current.toISOString().substring(0, 7)); // YYYY-MM format
        current.setMonth(current.getMonth() + 1);
    }
    
    return months;
});

const monthDisplayNames = computed<string[]>(() => {
    return allMonths.value.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    });
});

const chartSeries = computed(() => {
    return monthlyData.value
        .filter(item => props.selectedCategories?.includes(item.categoryId) ?? true)
        .map((item) => ({
            name: item.categoryName,
            type: 'bar',
            stack: 'category',
            data: allMonths.value.map(month => item.months[month] || 0),
            itemStyle: {
                color: getDisplayColor(item.color)
            }
        }));
});

const maxValue = computed<number>(() => {
    if (!chartSeries.value.length) return 0;
    
    const monthTotals = allMonths.value.map((_, monthIndex) => {
        return chartSeries.value.reduce((sum, series) => {
            return sum + (series.data[monthIndex] as number);
        }, 0);
    });
    
    return Math.max(...monthTotals);
});

const yAxisWidth = computed<number>(() => {
    if (maxValue.value === 0) return 90;
    
    const maxValueText = formatAmountToLocalizedNumeralsWithCurrency(maxValue.value, props.currency || 'USD');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
        context.font = '12px Arial';
        const textMetrics = context.measureText(maxValueText);
        const actualWidth = Math.round(textMetrics.width) + 20;
        return Math.min(Math.max(actualWidth, 90), 200);
    }
    
    return 90;
});

const chartOptions = computed<object>(() => {
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            backgroundColor: isDarkMode.value ? '#333' : '#fff',
            borderColor: isDarkMode.value ? '#333' : '#fff',
            textStyle: {
                color: isDarkMode.value ? '#eee' : '#333'
            },
            formatter: (params: CallbackDataParams[]) => {
                if (!params || !params.length) return '';
                
                let tooltip = `<div><strong>${params[0].name}</strong></div>`;
                let total = 0;
                
                params.forEach(param => {
                    const value = param.data as number;
                    if (value > 0) {
                        const formattedValue = formatAmountToLocalizedNumeralsWithCurrency(value, props.currency || 'USD');
                        tooltip += `<div><span class="chart-pointer" style="background-color: ${param.color}"></span>`;
                        tooltip += `<span>${param.seriesName}</span><span style="float: right; margin-left: 20px;">${formattedValue}</span></div>`;
                        total += value;
                    }
                });
                
                if (params.length > 1) {
                    const formattedTotal = formatAmountToLocalizedNumeralsWithCurrency(total, props.currency || 'USD');
                    tooltip += `<div style="border-top: 1px dashed ${isDarkMode.value ? '#eee' : '#333'}; margin-top: 8px; padding-top: 8px;">`;
                    tooltip += `<span><strong>${tt('Total')}</strong></span><span style="float: right; margin-left: 20px;"><strong>${formattedTotal}</strong></span></div>`;
                }
                
                return tooltip;
            }
        },
        legend: {
            orient: 'horizontal',
            top: 'top',
            type: 'scroll',
            selected: selectedLegends.value,
            textStyle: {
                color: isDarkMode.value ? '#eee' : '#333'
            }
        },
        grid: {
            left: yAxisWidth.value,
            right: 20,
            top: 80,
            bottom: 60,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: monthDisplayNames.value,
            axisLabel: {
                rotate: monthDisplayNames.value.length > 6 ? 45 : 0,
                color: isDarkMode.value ? '#eee' : '#333'
            },
            axisLine: {
                lineStyle: {
                    color: isDarkMode.value ? '#4f4f4f' : '#e1e6f2'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value: number) => {
                    return formatAmountToLocalizedNumeralsWithCurrency(value, props.currency || 'USD');
                },
                color: isDarkMode.value ? '#eee' : '#333'
            },
            axisLine: {
                lineStyle: {
                    color: isDarkMode.value ? '#4f4f4f' : '#e1e6f2'
                }
            },
            splitLine: {
                lineStyle: {
                    color: isDarkMode.value ? '#4f4f4f' : '#e1e6f2',
                }
            }
        },
        series: chartSeries.value
    };
});

onMounted(() => {
    // Initialize legend selection
    monthlyData.value.forEach(item => {
        selectedLegends.value[item.categoryName] = props.selectedCategories?.includes(item.categoryId) ?? true;
    });
});

watch(() => props.selectedCategories, () => {
    monthlyData.value.forEach(item => {
        selectedLegends.value[item.categoryName] = props.selectedCategories?.includes(item.categoryId) ?? true;
    });
}, { deep: true });
</script>

<style scoped>
.monthly-category-chart-container {
    width: 100%;
    height: 480px;
    margin-top: 10px;
}

@media (min-width: 600px) {
    .monthly-category-chart-container {
        height: 520px;
    }
}
</style>