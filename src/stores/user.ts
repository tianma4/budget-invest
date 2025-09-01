import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { useSettingsStore } from './setting.ts';

import { CalendarDisplayType, DateDisplayType } from '@/core/calendar.ts';
import { type WeekDayValue, WeekDay } from '@/core/datetime.ts';
import { FiscalYearStart } from '@/core/fiscalyear.ts';
import type { ApplicationCloudSetting } from '@/core/setting.ts';

import {
    type UserBasicInfo,
    type UserProfileResponse,
    type UserProfileUpdateResponse,
    User,
    EMPTY_USER_BASIC_INFO
} from '@/models/user.ts';

import type {
    ExportTransactionDataRequest,
    DataStatisticsResponse
} from '@/models/data_management.ts';

import {
    isObject,
    isString,
    isNumber
} from '@/lib/common.ts';

import {
    getCurrentUserInfo,
    updateCurrentUserInfo,
    clearCurrentUserInfo
} from '@/lib/userstate.ts';

import logger from '@/lib/logger.ts';
import services from '@/lib/services.ts';

export const useUserStore = defineStore('user', () => {
    const settingsStore = useSettingsStore();
    const currentUserBasicInfo = ref<UserBasicInfo | null>(getCurrentUserInfo());

    const currentUserNickname = computed<string | null>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.nickname || userInfo.username || null;
    });

    const currentUserAvatar = computed<string | null>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return getUserAvatarUrl(userInfo, false);
    });

    const currentUserDefaultAccountId = computed<string>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.defaultAccountId;
    });

    const currentUserLanguage = computed<string>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.language;
    });

    const currentUserDefaultCurrency = computed<string>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.defaultCurrency || settingsStore.localeDefaultSettings.currency;
    });

    const currentUserFirstDayOfWeek = computed<WeekDayValue>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return isNumber(userInfo.firstDayOfWeek) && WeekDay.valueOf(userInfo.firstDayOfWeek) ? userInfo.firstDayOfWeek as WeekDayValue : settingsStore.localeDefaultSettings.firstDayOfWeek;
    });

    const currentUserFiscalYearStart = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return isNumber(userInfo.fiscalYearStart) && FiscalYearStart.valueOf(userInfo.fiscalYearStart) ? userInfo.fiscalYearStart : EMPTY_USER_BASIC_INFO.fiscalYearStart;
    });

    const currentUserCalendarDisplayType = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return isNumber(userInfo.calendarDisplayType) && CalendarDisplayType.valueOf(userInfo.calendarDisplayType) ? userInfo.calendarDisplayType : EMPTY_USER_BASIC_INFO.calendarDisplayType;
    });

    const currentUserDateDisplayType = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return isNumber(userInfo.dateDisplayType) && DateDisplayType.valueOf(userInfo.dateDisplayType) ? userInfo.dateDisplayType : EMPTY_USER_BASIC_INFO.dateDisplayType;
    });

    const currentUserLongDateFormat = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.longDateFormat;
    });

    const currentUserShortDateFormat = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.shortDateFormat;
    });

    const currentUserLongTimeFormat = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.longTimeFormat;
    });

    const currentUserShortTimeFormat = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.shortTimeFormat;
    });

    const currentUserFiscalYearFormat = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.fiscalYearFormat;
    });

    const currentUserCurrencyDisplayType = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.currencyDisplayType;
    });

    const currentUserNumeralSystem = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.numeralSystem;
    });

    const currentUserDecimalSeparator = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.decimalSeparator;
    });

    const currentUserDigitGroupingSymbol = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.digitGroupingSymbol;
    });

    const currentUserDigitGrouping = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.digitGrouping;
    });

    const currentUserCoordinateDisplayType = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.coordinateDisplayType;
    });

    const currentUserExpenseAmountColor = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.expenseAmountColor;
    });

    const currentUserIncomeAmountColor = computed<number>(() => {
        const userInfo = currentUserBasicInfo.value || EMPTY_USER_BASIC_INFO;
        return userInfo.incomeAmountColor;
    });

    function generateNewUserModel(language: string): User {
        return User.createNewUser(language, settingsStore.localeDefaultSettings.currency, settingsStore.localeDefaultSettings.firstDayOfWeek);
    }

    function storeUserBasicInfo(userInfo: UserBasicInfo): void {
        currentUserBasicInfo.value = userInfo;
        updateCurrentUserInfo(userInfo);
    }

    function resetUserBasicInfo(): void {
        currentUserBasicInfo.value = null;
        clearCurrentUserInfo();
    }

    function getCurrentUserProfile(): Promise<UserProfileResponse> {
        return new Promise((resolve, reject) => {
            services.getProfile().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to retrieve user profile' });
                    return;
                }

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to retrieve user profile', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to retrieve user profile' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function updateUserTransactionEditScope({ transactionEditScope }: { transactionEditScope: number }): Promise<UserProfileUpdateResponse> {
        return new Promise((resolve, reject) => {
            services.updateProfile({ transactionEditScope }).then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result || !data.result.user || !isObject(data.result.user)) {
                    reject({ message: 'Unable to update editable transaction range' });
                    return;
                }

                storeUserBasicInfo(data.result.user);

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to save editable transaction range', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to update editable transaction range' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function updateUserAvatar({ avatarFile }: { avatarFile: File }): Promise<UserProfileResponse> {
        return new Promise((resolve, reject) => {
            services.updateAvatar({ avatarFile }).then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to update user avatar' });
                    return;
                }

                storeUserBasicInfo(data.result);

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to update user avatar', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to update user avatar' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function removeUserAvatar(): Promise<UserProfileResponse> {
        return new Promise((resolve, reject) => {
            services.removeAvatar().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to remove user avatar' });
                    return;
                }

                storeUserBasicInfo(data.result);

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to remove user avatar', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to remove user avatar' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function getUserApplicationCloudSettings(): Promise<ApplicationCloudSetting[] | false> {
        return new Promise((resolve, reject) => {
            services.getUserApplicationCloudSettings().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    resolve(data.result);
                    return;
                }

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to load user synchronized application settings', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to retrieve user synchronized application settings' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function fullUpdateUserApplicationCloudSettings(enabledSettingKeys: string[]): Promise<boolean> {
        const settings = settingsStore.createApplicationCloudSettings(enabledSettingKeys);

        return new Promise((resolve, reject) => {
            services.updateUserApplicationCloudSettings({
                settings: settings,
                fullUpdate: true
            }).then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to update user synchronized application settings' });
                    return;
                }

                settingsStore.updateApplicationSyncSettingKeys(enabledSettingKeys);
                resolve(data.result);
            }).catch(error => {
                logger.error('failed to update user synchronized application settings', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to update user synchronized application settings' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function disableUserApplicationCloudSettings(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            services.disableUserApplicationCloudSettings().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to disable user synchronized application settings' });
                    return;
                }

                settingsStore.updateApplicationSyncSettingKeys(undefined);
                resolve(data.result);
            }).catch(error => {
                logger.error('failed to disable user synchronized application settings', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to disable user synchronized application settings' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function getUserDataStatistics(): Promise<DataStatisticsResponse> {
        return new Promise((resolve, reject) => {
            services.getUserDataStatistics().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to retrieve user statistics data' });
                    return;
                }

                resolve(data.result);
            }).catch(error => {
                logger.error('failed to retrieve user statistics data', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to retrieve user statistics data' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function getExportedUserData(fileType: string, req?: ExportTransactionDataRequest): Promise<Blob> {
        return new Promise((resolve, reject) => {
            services.getExportedUserData(fileType, req).then(response => {
                if (response && response.headers) {
                    if (fileType === 'csv' && response.headers['content-type'] !== 'text/csv') {
                        reject({ message: 'Unable to retrieve exported user data' });
                        return;
                    } else if (fileType === 'tsv' && response.headers['content-type'] !== 'text/tab-separated-values') {
                        reject({ message: 'Unable to retrieve exported user data' });
                        return;
                    }
                }

                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                resolve(blob);
            }).catch(error => {
                logger.error('failed to retrieve user statistics data', error);

                if (error.response && error.response.headers['content-type'] === 'text/text' && error.response && error.response.data) {
                    reject({ message: 'error.' + error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to retrieve exported user data' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function getUserAvatarUrl(userInfoOrAvatarUrl: UserBasicInfo | string | null, disableBrowserCache: boolean | string): string | null {
        let avatarUrl = '';

        if (isObject(userInfoOrAvatarUrl)) {
            avatarUrl = userInfoOrAvatarUrl.avatar;
        } else if (isString(userInfoOrAvatarUrl)) {
            avatarUrl = userInfoOrAvatarUrl;
        }

        if (!avatarUrl) {
            return null;
        }

        return services.getInternalAvatarUrlWithToken(avatarUrl, disableBrowserCache);
    }

    return {
        // states
        currentUserBasicInfo,
        // computed states
        currentUserNickname,
        currentUserAvatar,
        currentUserDefaultAccountId,
        currentUserLanguage,
        currentUserDefaultCurrency,
        currentUserFirstDayOfWeek,
        currentUserFiscalYearStart,
        currentUserCalendarDisplayType,
        currentUserDateDisplayType,
        currentUserLongDateFormat,
        currentUserShortDateFormat,
        currentUserLongTimeFormat,
        currentUserShortTimeFormat,
        currentUserFiscalYearFormat,
        currentUserCurrencyDisplayType,
        currentUserNumeralSystem,
        currentUserDecimalSeparator,
        currentUserDigitGroupingSymbol,
        currentUserDigitGrouping,
        currentUserCoordinateDisplayType,
        currentUserExpenseAmountColor,
        currentUserIncomeAmountColor,
        // functions
        generateNewUserModel,
        storeUserBasicInfo,
        resetUserBasicInfo,
        getCurrentUserProfile,
        updateUserTransactionEditScope,
        updateUserAvatar,
        removeUserAvatar,
        getUserApplicationCloudSettings,
        fullUpdateUserApplicationCloudSettings,
        disableUserApplicationCloudSettings,
        getUserDataStatistics,
        getExportedUserData,
        getUserAvatarUrl
    };
});
