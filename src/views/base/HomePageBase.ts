import { computed } from 'vue';

import { useI18n } from '@/locales/helpers.ts';

import { useSettingsStore } from '@/stores/setting.ts';
import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useOverviewStore } from '@/stores/overview.ts';

import type { HiddenAmount, NumberWithSuffix } from '@/core/numeral.ts';
import { DISPLAY_HIDDEN_AMOUNT, INCOMPLETE_AMOUNT_SUFFIX } from '@/consts/numeral.ts';

import { Account } from '@/models/account.ts';
import type {
    TransactionOverviewResponse,
    TransactionOverviewDisplayTime,
    TransactionOverviewResponseItem
} from '@/models/transaction.ts';

export function useHomePageBase() {
    const {
        formatUnixTimeToLongDate,
        formatUnixTimeToLongYear,
        formatUnixTimeToLongMonth,
        formatUnixTimeToLongMonthDay,
        formatAmountToLocalizedNumeralsWithCurrency
    } = useI18n();

    const settingsStore = useSettingsStore();
    const userStore = useUserStore();
    const accountsStore = useAccountsStore();
    const overviewStore = useOverviewStore();

    const showAmountInHomePage = computed<boolean>({
        get: () => settingsStore.appSettings.showAmountInHomePage,
        set: (value) => settingsStore.setShowAmountInHomePage(value)
    });

    const defaultCurrency = computed<string>(() => userStore.currentUserDefaultCurrency);
    const allAccounts = computed<Account[]>(() => accountsStore.allAccounts);

    const netAssets = computed<string>(() => {
        const netAssets: number | HiddenAmount | NumberWithSuffix = accountsStore.getNetAssets(showAmountInHomePage.value);
        return formatAmountToLocalizedNumeralsWithCurrency(netAssets, defaultCurrency.value);
    });

    const totalAssets = computed<string>(() => {
        const totalAssets: number | HiddenAmount | NumberWithSuffix = accountsStore.getTotalAssets(showAmountInHomePage.value);
        return formatAmountToLocalizedNumeralsWithCurrency(totalAssets, defaultCurrency.value);
    });

    const totalLiabilities = computed<string>(() => {
        const totalLiabilities: number | HiddenAmount | NumberWithSuffix = accountsStore.getTotalLiabilities(showAmountInHomePage.value);
        return formatAmountToLocalizedNumeralsWithCurrency(totalLiabilities, defaultCurrency.value);
    });

    const displayDateRange = computed<TransactionOverviewDisplayTime>(() => {
        return {
            today: {
                displayTime: formatUnixTimeToLongDate(overviewStore.transactionDataRange.today.startTime),
            },
            thisWeek: {
                startTime: formatUnixTimeToLongMonthDay(overviewStore.transactionDataRange.thisWeek.startTime),
                endTime: formatUnixTimeToLongMonthDay(overviewStore.transactionDataRange.thisWeek.endTime)
            },
            thisMonth: {
                displayTime: formatUnixTimeToLongMonth(overviewStore.transactionDataRange.thisMonth.startTime),
                startTime: formatUnixTimeToLongMonthDay(overviewStore.transactionDataRange.thisMonth.startTime),
                endTime: formatUnixTimeToLongMonthDay(overviewStore.transactionDataRange.thisMonth.endTime)
            },
            thisYear: {
                displayTime: formatUnixTimeToLongYear(overviewStore.transactionDataRange.thisYear.startTime)
            }
        };
    });

    const transactionOverview = computed<TransactionOverviewResponse>(() => overviewStore.transactionOverview);

    function getDisplayAmount(amount: number, incomplete: boolean): string {
        if (!showAmountInHomePage.value) {
            return formatAmountToLocalizedNumeralsWithCurrency(DISPLAY_HIDDEN_AMOUNT, defaultCurrency.value);
        }

        return formatAmountToLocalizedNumeralsWithCurrency(amount, defaultCurrency.value) + (incomplete ? INCOMPLETE_AMOUNT_SUFFIX : '');
    }

    function getDisplayIncomeAmount(category: TransactionOverviewResponseItem): string {
        return getDisplayAmount(category.incomeAmount, category.incompleteIncomeAmount);
    }

    function getDisplayExpenseAmount(category: TransactionOverviewResponseItem): string {
        return getDisplayAmount(category.expenseAmount, category.incompleteExpenseAmount);
    }

    return {
        // computed states
        showAmountInHomePage,
        defaultCurrency,
        allAccounts,
        netAssets,
        totalAssets,
        totalLiabilities,
        displayDateRange,
        transactionOverview,
        // functions
        getDisplayAmount,
        getDisplayIncomeAmount,
        getDisplayExpenseAmount
    };
}
