import type { TypeAndName, TypeAndDisplayName } from '@/core/base.ts';

export type HiddenAmount = '***';

export interface NumberFormatOptions {
    readonly numeralSystem: NumeralSystem;
    readonly digitGrouping: DigitGroupingType;
    readonly digitGroupingSymbol: string;
    readonly decimalSeparator: string;
    readonly decimalNumberCount?: number;
    readonly trimTailZero?: boolean;
}

export interface NumberWithSuffix {
    readonly value: number;
    readonly suffix: string;
}

export interface NumeralSymbolType {
    readonly type: number;
    readonly name: string;
    readonly symbol: string;
}

export interface LocalizedNumeralSymbolType extends TypeAndDisplayName {
    readonly type: number;
    readonly symbol: string;
    readonly displayName: string;
}

export interface LocalizedDigitGroupingType extends TypeAndDisplayName {
    readonly type: number;
    readonly enabled: boolean;
    readonly displayName: string;
}

export class NumeralSystem implements TypeAndName {
    private static readonly allInstances: NumeralSystem[] = [];
    private static readonly allInstancesByType: Record<number, NumeralSystem> = {};
    private static readonly allInstancesByTypeName: Record<string, NumeralSystem> = {};
    private static readonly allDigitsToWesternArabic: Record<string, number> = {};
    private static readonly allDigitsToNumeralSystem: Record<string, NumeralSystem> = {};

    public static readonly LanguageDefaultType: number = 0;
    public static readonly WesternArabicNumerals = new NumeralSystem(1, 'WesternArabicNumerals', 'Western Arabic Numerals', '\u0030');
    public static readonly EasternArabicNumerals = new NumeralSystem(2, 'EasternArabicNumerals', 'Eastern Arabic Numerals', '\u0660');
    public static readonly PersianDigits = new NumeralSystem(3, 'PersianDigits', 'Persian Digits', '\u06F0');
    public static readonly BurmeseNumerals = new NumeralSystem(4, 'BurmeseNumerals', 'Burmese Numerals', '\u1040');
    public static readonly DevanagariNumerals = new NumeralSystem(5, 'DevanagariNumerals', 'Devanagari Numerals', '\u0966');

    public static readonly Default = NumeralSystem.WesternArabicNumerals;

    public readonly type: number;
    public readonly typeName: string;
    public readonly name: string;
    public readonly digitZero: string;
    public readonly doubleDigitZero: string;
    public readonly textualAllDigits: string;
    private readonly allDigits: string[];
    private readonly digitsToWesternArabic: Record<string, number> = {};

    private constructor(type: number, typeName: string, name: string, digitZero: string) {
        this.type = type;
        this.typeName = typeName;
        this.name = name;
        this.digitZero = digitZero;
        this.doubleDigitZero = digitZero + digitZero;
        this.allDigits = [];
        this.digitsToWesternArabic = {};

        for (let i = 0; i < 10; i++) {
            const digit = String.fromCharCode(this.digitZero.charCodeAt(0) + i);
            this.allDigits.push(digit);
            this.digitsToWesternArabic[digit] = i;
            NumeralSystem.allDigitsToWesternArabic[digit] = i;
            NumeralSystem.allDigitsToNumeralSystem[digit] = this;
        }

        this.textualAllDigits = this.allDigits.join('');

        NumeralSystem.allInstances.push(this);
        NumeralSystem.allInstancesByType[type] = this;
        NumeralSystem.allInstancesByTypeName[typeName] = this;
    }

    public getAllDigits(): string[] {
        return this.allDigits.slice();
    }

    public isDigit(digit: string): boolean {
        return this.digitsToWesternArabic.hasOwnProperty(digit);
    }

    public getLocalizedDigit(digit: number): string {
        if (digit < 0 || digit > 9) {
            return '';
        }

        return this.allDigits[digit];
    }

    public parseInt(value: string): number {
        if (!value) {
            return Number.NaN;
        }

        if (this.type === NumeralSystem.WesternArabicNumerals.type) {
            return parseInt(value, 10);
        } else {
            const westernArabicValue = this.replaceLocalizedDigitsToWesternArabicDigits(value);
            return parseInt(westernArabicValue, 10);
        }
    }

    public formatNumber(value: number): string {
        if (Number.isNaN(value) || !Number.isFinite(value)) {
            return value.toString();
        }

        if (this.type === NumeralSystem.WesternArabicNumerals.type) {
            return value.toString(10);
        }

        if (value === 0) {
            return this.digitZero;
        }

        return this.replaceWesternArabicDigitsToLocalizedDigits(value.toString(10));
    }

    public replaceWesternArabicDigitsToLocalizedDigits(value: string): string {
        if (!value) {
            return '';
        }

        let result = '';

        for (let i = 0; i < value.length; i++) {
            const ch = value[i];

            if (NumeralSystem.WesternArabicNumerals.isDigit(ch)) {
                const digit = NumeralSystem.WesternArabicNumerals.digitsToWesternArabic[ch];
                result += this.allDigits[digit];
            } else {
                result += ch;
            }
        }

        return result;
    }

    public replaceLocalizedDigitsToWesternArabicDigits(value: string): string {
        if (!value) {
            return '';
        }

        let result = '';

        for (let i = 0; i < value.length; i++) {
            const ch = value[i];

            if (this.isDigit(ch)) {
                const digit = this.digitsToWesternArabic[ch];
                result += NumeralSystem.WesternArabicNumerals.allDigits[digit];
            } else {
                result += ch;
            }
        }

        return result;
    }

    public static values(): NumeralSystem[] {
        return NumeralSystem.allInstances;
    }

    public static valueOf(type: number): NumeralSystem | undefined {
        return NumeralSystem.allInstancesByType[type];
    }

    public static parse(typeName: string): NumeralSystem | undefined {
        return NumeralSystem.allInstancesByTypeName[typeName];
    }

    public static detect(digit: string): NumeralSystem | undefined {
        return NumeralSystem.allDigitsToNumeralSystem[digit];
    }

    public static toNumber(digit: string): number | undefined {
        return NumeralSystem.allDigitsToWesternArabic[digit];
    }
}

export class DecimalSeparator implements TypeAndName, NumeralSymbolType {
    private static readonly allInstances: DecimalSeparator[] = [];
    private static readonly allInstancesByType: Record<number, DecimalSeparator> = {};
    private static readonly allInstancesByTypeName: Record<string, DecimalSeparator> = {};

    public static readonly LanguageDefaultType: number = 0;
    public static readonly Dot = new DecimalSeparator(1, 'Dot', '.');
    public static readonly Comma = new DecimalSeparator(2, 'Comma', ',');

    public static readonly Default = DecimalSeparator.Dot;

    public readonly type: number;
    public readonly name: string;
    public readonly symbol: string;

    private constructor(type: number, name: string, symbol: string) {
        this.type = type;
        this.name = name;
        this.symbol = symbol;

        DecimalSeparator.allInstances.push(this);
        DecimalSeparator.allInstancesByType[type] = this;
        DecimalSeparator.allInstancesByTypeName[name] = this;
    }

    public static values(): DecimalSeparator[] {
        return DecimalSeparator.allInstances;
    }

    public static valueOf(type: number): DecimalSeparator | undefined {
        return DecimalSeparator.allInstancesByType[type];
    }

    public static parse(typeName: string): DecimalSeparator | undefined {
        return DecimalSeparator.allInstancesByTypeName[typeName];
    }
}

export class DigitGroupingSymbol implements TypeAndName, NumeralSymbolType {
    private static readonly allInstances: DigitGroupingSymbol[] = [];
    private static readonly allInstancesByType: Record<number, DigitGroupingSymbol> = {};
    private static readonly allInstancesByTypeName: Record<string, DigitGroupingSymbol> = {};

    public static readonly LanguageDefaultType: number = 0;
    public static readonly Dot = new DigitGroupingSymbol(1, 'Dot', '.');
    public static readonly Comma = new DigitGroupingSymbol(2, 'Comma', ',');
    public static readonly Space = new DigitGroupingSymbol(3, 'Space', ' ');
    public static readonly Apostrophe = new DigitGroupingSymbol(4, 'Apostrophe', '\'');

    public static readonly Default = DigitGroupingSymbol.Comma;

    public readonly type: number;
    public readonly name: string;
    public readonly symbol: string;

    private constructor(type: number, name: string, symbol: string) {
        this.type = type;
        this.name = name;
        this.symbol = symbol;

        DigitGroupingSymbol.allInstances.push(this);
        DigitGroupingSymbol.allInstancesByType[type] = this;
        DigitGroupingSymbol.allInstancesByTypeName[name] = this;
    }

    public static values(): DigitGroupingSymbol[] {
        return DigitGroupingSymbol.allInstances;
    }

    public static valueOf(type: number): DigitGroupingSymbol | undefined {
        return DigitGroupingSymbol.allInstancesByType[type];
    }

    public static parse(typeName: string): DigitGroupingSymbol | undefined {
        return DigitGroupingSymbol.allInstancesByTypeName[typeName];
    }
}

export class DigitGroupingType implements TypeAndName {
    private static readonly allInstances: DigitGroupingType[] = [];
    private static readonly allInstancesByType: Record<number, DigitGroupingType> = {};
    private static readonly allInstancesByTypeName: Record<string, DigitGroupingType> = {};

    public static readonly LanguageDefaultType: number = 0;
    public static readonly None = new DigitGroupingType(1, 'None', 'None', false,
        (numericChars: string[]) => {
            return numericChars.join('');
        }
    );
    public static readonly ThousandsSeparator = new DigitGroupingType(2, 'ThousandsSeparator', 'Thousands Separator', true,
        (numericChars: string[], digitGroupingSymbol: string) => {
            if (numericChars.length <= 3) {
                return numericChars.join('');
            }

            let ret = '';

            for (let i = numericChars.length - 1, j = 0; i >= 0; i--, j++) {
                if (j > 0 && j % 3 === 0) {
                    ret = digitGroupingSymbol + ret;
                }

                ret = numericChars[i] + ret;
            }

            return ret;
        }
    );
    public static readonly IndianNumberGrouping = new DigitGroupingType(3, 'IndianNumberGrouping', 'Indian Number Grouping', true,
        (numericChars: string[], digitGroupingSymbol: string) => {
            if (numericChars.length <= 3) {
                return numericChars.join('');
            }

            let ret = '';
            const length = numericChars.length;

            for (let i = length - 1, j = 0; i >= 0; i--, j++) {
                if (j === 3) {
                    ret = digitGroupingSymbol + ret;
                } else if (j > 3 && (j - 3) % 2 === 0) {
                    ret = digitGroupingSymbol + ret;
                }

                ret = numericChars[i] + ret;
            }

            return ret;
        }
    );

    public static readonly Default = DigitGroupingType.ThousandsSeparator;

    public readonly type: number;
    public readonly typeName: string;
    public readonly name: string;
    public readonly enabled: boolean;
    public readonly format: (numericChars: string[], digitGroupingSymbol: string) => string;

    private constructor(type: number, typeName: string, name: string, enabled: boolean, format: (numericChars: string[], digitGroupingSymbol: string) => string) {
        this.type = type;
        this.typeName = typeName;
        this.name = name;
        this.enabled = enabled;
        this.format = format;

        DigitGroupingType.allInstances.push(this);
        DigitGroupingType.allInstancesByType[type] = this;
        DigitGroupingType.allInstancesByTypeName[typeName] = this;
    }

    public static values(): DigitGroupingType[] {
        return DigitGroupingType.allInstances;
    }

    public static valueOf(type: number): DigitGroupingType | undefined {
        return DigitGroupingType.allInstancesByType[type];
    }

    public static parse(typeName: string): DigitGroupingType | undefined {
        return DigitGroupingType.allInstancesByTypeName[typeName];
    }
}

export class KnownAmountFormat {
    private static readonly allInstances: KnownAmountFormat[] = [];
    private static readonly allInstancesByType: Record<string, KnownAmountFormat> = {};

    public static readonly DotDecimalSeparator = new KnownAmountFormat('1234.56', DecimalSeparator.Dot, undefined, /^-?[0-9]+(\.[0-9]+)?$/);
    public static readonly CommaDecimalSeparator = new KnownAmountFormat('1234,56', DecimalSeparator.Comma, undefined, /^-?[0-9]+(,[0-9]+)?$/);
    public static readonly DotDecimalSeparatorWithCommaGroupingSymbol = new KnownAmountFormat('1,234.56', DecimalSeparator.Dot, DigitGroupingSymbol.Comma, /^-?([0-9]+,)*[0-9]+(\.[0-9]+)?$/);
    public static readonly CommaDecimalSeparatorWithDotGroupingSymbol = new KnownAmountFormat('1.234,56', DecimalSeparator.Comma, DigitGroupingSymbol.Dot, /^-?([0-9]+\.)*[0-9]+(,[0-9]+)?$/);
    public static readonly DotDecimalSeparatorWithSpaceGroupingSymbol = new KnownAmountFormat('1 234.56', DecimalSeparator.Dot, DigitGroupingSymbol.Space, /^-?([0-9]+ )*[0-9]+(\.[0-9]+)?$/);
    public static readonly CommaDecimalSeparatorWithSpaceGroupingSymbol = new KnownAmountFormat('1 234,56', DecimalSeparator.Comma, DigitGroupingSymbol.Space, /^-?([0-9]+ )*[0-9]+(,[0-9]+)?$/);
    public static readonly DotDecimalSeparatorWithApostropheGroupingSymbol = new KnownAmountFormat('1\'234.56', DecimalSeparator.Dot, DigitGroupingSymbol.Apostrophe, /^-?([0-9]+')*[0-9]+(\.[0-9]+)?$/);
    public static readonly CommaDecimalSeparatorWithApostropheGroupingSymbol = new KnownAmountFormat('1\'234,56', DecimalSeparator.Comma, DigitGroupingSymbol.Apostrophe, /^-?([0-9]+')*[0-9]+(,[0-9]+)?$/);

    public readonly format: string;
    public readonly decimalSeparator: DecimalSeparator;
    public readonly digitGroupingSymbol?: DigitGroupingSymbol;
    public readonly type: string;
    private readonly regex: RegExp;

    private constructor(format: string, decimalSeparator: DecimalSeparator, digitGroupingSymbol: DigitGroupingSymbol | undefined, regex: RegExp) {
        this.format = format;
        this.decimalSeparator = decimalSeparator;
        this.digitGroupingSymbol = digitGroupingSymbol;
        this.type = this.decimalSeparator.type + '-' + (this.digitGroupingSymbol ? this.digitGroupingSymbol.type : 0).toString();
        this.regex = regex;

        KnownAmountFormat.allInstances.push(this);
        KnownAmountFormat.allInstancesByType[this.type] = this;
    }

    public isValid(amount: string): boolean {
        return this.regex.test(amount);
    }

    public static values(): KnownAmountFormat[] {
        return KnownAmountFormat.allInstances;
    }

    public static valueOf(type: string): KnownAmountFormat | undefined {
        return KnownAmountFormat.allInstancesByType[type];
    }

    public static detect(amount: string): KnownAmountFormat[] | undefined {
        const result: KnownAmountFormat[] = [];

        for (const format of KnownAmountFormat.allInstances) {
            if (format.isValid(amount)) {
                result.push(format);
            }
        }

        return result.length > 0 ? result : undefined;
    }

    public static detectMulti(amounts: string[]): KnownAmountFormat[] | undefined {
        const detectedCounts: Record<string, number> = {};

        for (const amount of amounts) {
            const detectedFormats = KnownAmountFormat.detect(amount);

            if (detectedFormats) {
                for (const format of detectedFormats) {
                    detectedCounts[format.type] = (detectedCounts[format.type] || 0) + 1;
                }
            } else {
                return undefined;
            }
        }

        const result: KnownAmountFormat[] = [];

        for (const format of KnownAmountFormat.allInstances) {
            if (detectedCounts[format.type] === amounts.length) {
                result.push(format);
            }
        }

        return result.length > 0 ? result : undefined;
    }
}

export class AmountFilterType {
    private static readonly allInstances: AmountFilterType[] = [];
    private static readonly allInstancesByType: Record<string, AmountFilterType> = {};

    public static readonly GreaterThan = new AmountFilterType('gt', 'Greater than', 1);
    public static readonly LessThan = new AmountFilterType('lt', 'Less than', 1);
    public static readonly EqualTo = new AmountFilterType('eq', 'Equal to', 1);
    public static readonly NotEqualTo = new AmountFilterType('ne', 'Not equal to', 1);
    public static readonly Between = new AmountFilterType('bt', 'Between', 2);
    public static readonly NotBetween = new AmountFilterType('nb', 'Not between', 2);

    public readonly type: string;
    public readonly name: string;
    public readonly paramCount: number;

    private constructor(type: string, name: string, paramCount: number) {
        this.type = type;
        this.name = name;
        this.paramCount = paramCount;

        AmountFilterType.allInstances.push(this);
        AmountFilterType.allInstancesByType[type] = this;
    }

    public static values(): AmountFilterType[] {
        return AmountFilterType.allInstances;
    }

    public static valueOf(type: string): AmountFilterType | undefined {
        return AmountFilterType.allInstancesByType[type];
    }
}
