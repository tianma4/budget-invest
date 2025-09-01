import { ref, computed } from 'vue';

import { useI18n } from '@/locales/helpers.ts';

import { useSettingsStore } from '@/stores/setting.ts';
import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';

import type { TypeAndDisplayName } from '@/core/base.ts';
import type { WeekDayValue } from '@/core/datetime.ts';
import { TransactionType } from '@/core/transaction.ts';
import { KnownFileType } from '@/core/file.ts';
import type { Account } from '@/models/account.ts';
import type { TransactionCategory } from '@/models/transaction_category.ts';
import type {
    TransactionReconciliationStatementResponse,
    TransactionReconciliationStatementResponseItem
} from '@/models/transaction.ts';

import { replaceAll } from '@/lib/common.ts';

import {
    getUtcOffsetByUtcOffsetMinutes,
    getTimezoneOffsetMinutes,
    parseDateTimeFromUnixTime
} from '@/lib/datetime.ts';

export function useReconciliationStatementPageBase() {
    const {
        tt,
        getAllAccountBalanceTrendChartTypes,
        getAllStatisticsDateAggregationTypesWithShortName,
        formatUnixTimeToDefaultDateTimeWithoutLocaleOptions,
        formatUnixTimeToLongDateTime,
        formatUnixTimeToLongDate,
        formatUnixTimeToShortTime,
        formatAmountToWesternArabicNumeralsWithoutDigitGrouping,
        formatAmountToLocalizedNumeralsWithCurrency
    } = useI18n();

    const settingsStore = useSettingsStore();
    const userStore = useUserStore();
    const accountsStore = useAccountsStore();
    const transactionCategoriesStore = useTransactionCategoriesStore();

    const accountId = ref<string>('');
    const startTime = ref<number>(0);
    const endTime = ref<number>(0);
    const reconciliationStatements = ref<TransactionReconciliationStatementResponse | undefined>(undefined);

    const firstDayOfWeek = computed<WeekDayValue>(() => userStore.currentUserFirstDayOfWeek);
    const fiscalYearStart = computed<number>(() => userStore.currentUserFiscalYearStart);
    const currentTimezoneOffsetMinutes = computed<number>(() => getTimezoneOffsetMinutes(settingsStore.appSettings.timeZone));
    const defaultCurrency = computed<string>(() => userStore.currentUserDefaultCurrency);

    const allChartTypes = computed<TypeAndDisplayName[]>(() => getAllAccountBalanceTrendChartTypes());
    const allDateAggregationTypes = computed<TypeAndDisplayName[]>(() => getAllStatisticsDateAggregationTypesWithShortName());

    const currentAccount = computed(() => allAccountsMap.value[accountId.value]);
    const currentAccountCurrency = computed<string>(() => currentAccount.value?.currency ?? defaultCurrency.value);
    const isCurrentLiabilityAccount = computed<boolean>(() => currentAccount.value?.isLiability ?? false);

    const exportFileName = computed<string>(() => {
        const nickname = userStore.currentUserNickname;

        if (nickname) {
            return tt('dataExport.exportReconciliationStatementsFileName', {
                nickname: nickname
            });
        }

        return tt('dataExport.defaultExportReconciliationStatementsFileName');
    });

    const allAccountsMap = computed<Record<string, Account>>(() => accountsStore.allAccountsMap);
    const allCategoriesMap = computed<Record<string, TransactionCategory>>(() => transactionCategoriesStore.allTransactionCategoriesMap);

    const displayStartDateTime = computed<string>(() => {
        return formatUnixTimeToLongDateTime(startTime.value);
    });

    const displayEndDateTime = computed<string>(() => {
        return formatUnixTimeToLongDateTime(endTime.value);
    });

    const displayTotalInflows = computed<string>(() => {
        return formatAmountToLocalizedNumeralsWithCurrency(reconciliationStatements.value?.totalInflows ?? 0, currentAccountCurrency.value);
    });

    const displayTotalOutflows = computed<string>(() => {
        return formatAmountToLocalizedNumeralsWithCurrency(reconciliationStatements.value?.totalOutflows ?? 0, currentAccountCurrency.value);
    });

    const displayTotalBalance = computed<string>(() => {
        return formatAmountToLocalizedNumeralsWithCurrency((reconciliationStatements?.value?.totalInflows ?? 0) - (reconciliationStatements.value?.totalOutflows ?? 0), currentAccountCurrency.value);
    });

    const displayOpeningBalance = computed<string>(() => {
        if (isCurrentLiabilityAccount.value) {
            return formatAmountToLocalizedNumeralsWithCurrency(-(reconciliationStatements?.value?.openingBalance ?? 0), currentAccountCurrency.value);
        } else {
            return formatAmountToLocalizedNumeralsWithCurrency(reconciliationStatements?.value?.openingBalance ?? 0, currentAccountCurrency.value);
        }
    });

    const displayClosingBalance = computed<string>(() => {
        if (isCurrentLiabilityAccount.value) {
            return formatAmountToLocalizedNumeralsWithCurrency(-(reconciliationStatements?.value?.closingBalance ?? 0), currentAccountCurrency.value);
        } else {
            return formatAmountToLocalizedNumeralsWithCurrency(reconciliationStatements?.value?.closingBalance ?? 0, currentAccountCurrency.value);
        }
    });

    function getDisplayTransactionType(transaction: TransactionReconciliationStatementResponseItem): string {
        if (transaction.type === TransactionType.ModifyBalance) {
            return tt('Modify Balance');
        } else if (transaction.type === TransactionType.Income) {
            return tt('Income');
        } else if (transaction.type === TransactionType.Expense) {
            return tt('Expense');
        } else if (transaction.type === TransactionType.Transfer && transaction.destinationAccountId === accountId.value) {
            return tt('Transfer In');
        } else if (transaction.type === TransactionType.Transfer && transaction.sourceAccountId === accountId.value) {
            return tt('Transfer Out');
        } else if (transaction.type === TransactionType.Transfer) {
            return tt('Transfer');
        } else {
            return tt('Unknown');
        }
    }

    function getDisplayDateTime(transaction: TransactionReconciliationStatementResponseItem): string {
        return formatUnixTimeToLongDateTime(transaction.time, transaction.utcOffset, currentTimezoneOffsetMinutes.value);
    }

    function getDisplayDate(transaction: TransactionReconciliationStatementResponseItem): string {
        return formatUnixTimeToLongDate(transaction.time, transaction.utcOffset, currentTimezoneOffsetMinutes.value);
    }

    function getDisplayTime(transaction: TransactionReconciliationStatementResponseItem): string {
        return formatUnixTimeToShortTime(transaction.time, transaction.utcOffset, currentTimezoneOffsetMinutes.value);
    }

    function getDisplayTimezone(transaction: TransactionReconciliationStatementResponseItem): string {
        return `UTC${getUtcOffsetByUtcOffsetMinutes(transaction.utcOffset)}`;
    }

    function getDisplaySourceAmount(transaction: TransactionReconciliationStatementResponseItem): string {
        let currency = defaultCurrency.value;

        if (allAccountsMap.value[transaction.sourceAccountId]) {
            currency = allAccountsMap.value[transaction.sourceAccountId].currency;
        }

        return formatAmountToLocalizedNumeralsWithCurrency(transaction.sourceAmount, currency);
    }

    function getDisplayDestinationAmount(transaction: TransactionReconciliationStatementResponseItem): string {
        let currency = defaultCurrency.value;

        if (allAccountsMap.value[transaction.destinationAccountId]) {
            currency = allAccountsMap.value[transaction.destinationAccountId].currency;
        }

        return formatAmountToLocalizedNumeralsWithCurrency(transaction.destinationAmount, currency);
    }

    function getDisplayAccountBalance(transaction: TransactionReconciliationStatementResponseItem): string {
        let currency = defaultCurrency.value;
        let isLiabilityAccount = false;

        if (transaction.type === TransactionType.Transfer && transaction.destinationAccountId === accountId.value) {
            if (allAccountsMap.value[transaction.destinationAccountId]) {
                currency = allAccountsMap.value[transaction.destinationAccountId].currency;
                isLiabilityAccount = allAccountsMap.value[transaction.destinationAccountId].isLiability;
            }
        } else if (allAccountsMap.value[transaction.sourceAccountId]) {
            currency = allAccountsMap.value[transaction.sourceAccountId].currency;
            isLiabilityAccount = allAccountsMap.value[transaction.sourceAccountId].isLiability;
        }

        if (isLiabilityAccount) {
            return formatAmountToLocalizedNumeralsWithCurrency(-transaction.accountClosingBalance, currency);
        } else {
            return formatAmountToLocalizedNumeralsWithCurrency(transaction.accountClosingBalance, currency);
        }
    }

    function getExportedData(fileType: KnownFileType): string {
        let separator = ',';

        if (fileType === KnownFileType.TSV) {
            separator = '\t';
        }

        const accountBalanceName = isCurrentLiabilityAccount.value ? 'Account Outstanding Balance' : 'Account Balance';

        const header = [
            tt('Transaction Time'),
            tt('Type'),
            tt('Category'),
            tt('Amount'),
            tt('Account'),
            tt(accountBalanceName),
            tt('Description')
        ].join(separator) + '\n';

        const transactions = reconciliationStatements.value?.transactions ?? [];
        const rows = transactions.map(transaction => {
            const transactionTime = parseDateTimeFromUnixTime(transaction.time, transaction.utcOffset, currentTimezoneOffsetMinutes.value).getUnixTime();
            const type = getDisplayTransactionType(transaction);
            let categoryName = allCategoriesMap.value[transaction.categoryId]?.name || '';
            let displayAmount = formatAmountToWesternArabicNumeralsWithoutDigitGrouping(transaction.sourceAmount);
            let displayAccountName = allAccountsMap.value[transaction.sourceAccountId]?.name || '';

            if (transaction.type === TransactionType.ModifyBalance) {
                categoryName = tt('Modify Balance');
            } else if (transaction.type === TransactionType.Transfer && transaction.destinationAccountId === accountId.value) {
                displayAmount = formatAmountToWesternArabicNumeralsWithoutDigitGrouping(transaction.destinationAmount);
            }

            if (transaction.type === TransactionType.Transfer && allAccountsMap.value[transaction.destinationAccountId]) {
                displayAccountName = displayAccountName + ' → ' + (allAccountsMap.value[transaction.destinationAccountId]?.name || '');
            }

            let displayAccountBalance = '';

            if (isCurrentLiabilityAccount.value) {
                displayAccountBalance = formatAmountToWesternArabicNumeralsWithoutDigitGrouping(-transaction.accountClosingBalance);
            } else {
                displayAccountBalance = formatAmountToWesternArabicNumeralsWithoutDigitGrouping(transaction.accountClosingBalance);
            }

            let description = transaction.comment || '';

            if (fileType === KnownFileType.CSV) {
                description = replaceAll(description, ',', ' ');
            } else if (fileType === KnownFileType.TSV) {
                description = replaceAll(description, '\t', ' ');
            }

            return [
                formatUnixTimeToDefaultDateTimeWithoutLocaleOptions(transactionTime),
                type,
                categoryName,
                displayAmount,
                displayAccountName,
                displayAccountBalance,
                description
            ].join(separator);
        });

        return header + rows.join('\n');
    }

    return {
        // states
        accountId,
        startTime,
        endTime,
        reconciliationStatements,
        // computed states
        firstDayOfWeek,
        fiscalYearStart,
        currentTimezoneOffsetMinutes,
        defaultCurrency,
        allChartTypes,
        allDateAggregationTypes,
        currentAccount,
        currentAccountCurrency,
        isCurrentLiabilityAccount,
        exportFileName,
        allAccountsMap,
        allCategoriesMap,
        displayStartDateTime,
        displayEndDateTime,
        displayTotalInflows,
        displayTotalOutflows,
        displayTotalBalance,
        displayOpeningBalance,
        displayClosingBalance,
        // functions
        getDisplayTransactionType,
        getDisplayDateTime,
        getDisplayDate,
        getDisplayTime,
        getDisplayTimezone,
        getDisplaySourceAmount,
        getDisplayDestinationAmount,
        getDisplayAccountBalance,
        getExportedData
    };
}
