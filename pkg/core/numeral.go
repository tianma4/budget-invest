package core

import (
	"fmt"
)

// NumeralSystem represents the type of numeral system
type NumeralSystem byte

// Numeral System
const (
	NUMERAL_SYSTEM_DEFAULT                 NumeralSystem = 0
	NUMERAL_SYSTEM_WESTERN_ARABIC_NUMERALS NumeralSystem = 1
	NUMERAL_SYSTEM_EASTERN_ARABIC_NUMERALS NumeralSystem = 2
	NUMERAL_SYSTEM_PERSIAN_DIGITS          NumeralSystem = 3
	NUMERAL_SYSTEM_BURMESE_NUMERALS        NumeralSystem = 4
	NUMERAL_SYSTEM_DEVANAGARI_NUMERALS     NumeralSystem = 5
	NUMERAL_SYSTEM_INVALID                 NumeralSystem = 255
)

// String returns a textual representation of the decimal separator enum
func (f NumeralSystem) String() string {
	switch f {
	case NUMERAL_SYSTEM_DEFAULT:
		return "Default"
	case NUMERAL_SYSTEM_WESTERN_ARABIC_NUMERALS:
		return "Western Arabic Numerals"
	case NUMERAL_SYSTEM_EASTERN_ARABIC_NUMERALS:
		return "Eastern Arabic Numerals"
	case NUMERAL_SYSTEM_PERSIAN_DIGITS:
		return "Persian Digits"
	case NUMERAL_SYSTEM_BURMESE_NUMERALS:
		return "Burmese Numerals"
	case NUMERAL_SYSTEM_DEVANAGARI_NUMERALS:
		return "Devanagari Numerals"
	default:
		return fmt.Sprintf("Invalid(%d)", int(f))
	}
}

// DecimalSeparator represents the type of decimal separator
type DecimalSeparator byte

// Decimal Separator
const (
	DECIMAL_SEPARATOR_DEFAULT DecimalSeparator = 0
	DECIMAL_SEPARATOR_DOT     DecimalSeparator = 1
	DECIMAL_SEPARATOR_COMMA   DecimalSeparator = 2
	DECIMAL_SEPARATOR_INVALID DecimalSeparator = 255
)

// String returns a textual representation of the decimal separator enum
func (f DecimalSeparator) String() string {
	switch f {
	case DECIMAL_SEPARATOR_DEFAULT:
		return "Default"
	case DECIMAL_SEPARATOR_DOT:
		return "Dot"
	case DECIMAL_SEPARATOR_COMMA:
		return "Comma"
	case DECIMAL_SEPARATOR_INVALID:
		return "Invalid"
	default:
		return fmt.Sprintf("Invalid(%d)", int(f))
	}
}

// DigitGroupingSymbol represents the digit grouping symbol
type DigitGroupingSymbol byte

// Digit Grouping Symbol
const (
	DIGIT_GROUPING_SYMBOL_DEFAULT    DigitGroupingSymbol = 0
	DIGIT_GROUPING_SYMBOL_DOT        DigitGroupingSymbol = 1
	DIGIT_GROUPING_SYMBOL_COMMA      DigitGroupingSymbol = 2
	DIGIT_GROUPING_SYMBOL_SPACE      DigitGroupingSymbol = 3
	DIGIT_GROUPING_SYMBOL_APOSTROPHE DigitGroupingSymbol = 4
	DIGIT_GROUPING_SYMBOL_INVALID    DigitGroupingSymbol = 255
)

// String returns a textual representation of the digit grouping symbol enum
func (f DigitGroupingSymbol) String() string {
	switch f {
	case DIGIT_GROUPING_SYMBOL_DEFAULT:
		return "Default"
	case DIGIT_GROUPING_SYMBOL_DOT:
		return "Dot"
	case DIGIT_GROUPING_SYMBOL_COMMA:
		return "Comma"
	case DIGIT_GROUPING_SYMBOL_SPACE:
		return "Space"
	case DIGIT_GROUPING_SYMBOL_APOSTROPHE:
		return "Apostrophe"
	case DIGIT_GROUPING_SYMBOL_INVALID:
		return "Invalid"
	default:
		return fmt.Sprintf("Invalid(%d)", int(f))
	}
}

// DigitGroupingType represents digit grouping type
type DigitGroupingType byte

// Digit Grouping Type
const (
	DIGIT_GROUPING_TYPE_DEFAULT                DigitGroupingType = 0
	DIGIT_GROUPING_TYPE_NONE                   DigitGroupingType = 1
	DIGIT_GROUPING_TYPE_THOUSANDS_SEPARATOR    DigitGroupingType = 2
	DIGIT_GROUPING_TYPE_INDIAN_NUMBER_GROUPING DigitGroupingType = 3
	DIGIT_GROUPING_TYPE_INVALID                DigitGroupingType = 255
)

// String returns a textual representation of the digit grouping type enum
func (d DigitGroupingType) String() string {
	switch d {
	case DIGIT_GROUPING_TYPE_DEFAULT:
		return "Default"
	case DIGIT_GROUPING_TYPE_NONE:
		return "None"
	case DIGIT_GROUPING_TYPE_THOUSANDS_SEPARATOR:
		return "Thousands Separator"
	case DIGIT_GROUPING_TYPE_INDIAN_NUMBER_GROUPING:
		return "Indian Number Grouping"
	case DIGIT_GROUPING_TYPE_INVALID:
		return "Invalid"
	default:
		return fmt.Sprintf("Invalid(%d)", int(d))
	}
}
