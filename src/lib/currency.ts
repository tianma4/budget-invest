import { CurrencyDisplaySymbol, CurrencyDisplayLocation, type CurrencyPrependAndAppendText, CurrencyDisplayType } from '@/core/currency.ts';
import { ALL_CURRENCIES, DEFAULT_CURRENCY_SYMBOL } from '@/consts/currency.ts';

export function getCurrencyFraction(currencyCode?: string): number | undefined {
    if (!currencyCode) {
        return undefined;
    }

    const currencyInfo = ALL_CURRENCIES[currencyCode];
    return currencyInfo?.fraction;
}

export function appendCurrencySymbol(value: string, currencyDisplayType: CurrencyDisplayType, currencyCode: string, currencyUnit: string, currencyName: string, isPlural: boolean): string {
    const symbol = getAmountPrependAndAppendCurrencySymbol(currencyDisplayType, currencyCode, currencyUnit, currencyName, isPlural);

    if (!symbol) {
        return value;
    }

    const separator = currencyDisplayType.separator || '';
    let ret = value;

    if (symbol.prependText) {
        ret = symbol.prependText + separator + ret;
    }

    if (symbol.appendText) {
        ret = ret + separator + symbol.appendText;
    }

    return ret;
}

export function getAmountPrependAndAppendCurrencySymbol(currencyDisplayType: CurrencyDisplayType, currencyCode: string, currencyUnit: string, currencyName: string, isPlural: boolean): CurrencyPrependAndAppendText | null {
    if (!currencyDisplayType) {
        return null;
    }

    let symbol = '';

    if (currencyDisplayType.symbol === CurrencyDisplaySymbol.Symbol) {
        const currencyInfo = ALL_CURRENCIES[currencyCode];

        if (currencyInfo && currencyInfo.symbol && currencyInfo.symbol.normal) {
            symbol = currencyInfo.symbol.normal;

            if (isPlural && currencyInfo.symbol.plural) {
                symbol = currencyInfo.symbol.plural;
            }
        }

        if (!symbol) {
            symbol = DEFAULT_CURRENCY_SYMBOL;
        }
    } else if (currencyDisplayType.symbol === CurrencyDisplaySymbol.Code) {
        symbol = currencyCode;
    } else if (currencyDisplayType.symbol === CurrencyDisplaySymbol.Unit) {
        symbol = currencyUnit;
    } else if (currencyDisplayType.symbol === CurrencyDisplaySymbol.Name) {
        symbol = currencyName;
    }

    if (currencyDisplayType.location === CurrencyDisplayLocation.BeforeAmount) {
        return {
            prependText: symbol
        };
    } else if (currencyDisplayType.location === CurrencyDisplayLocation.AfterAmount) {
        return {
            appendText: symbol
        };
    } else {
        return null;
    }
}
