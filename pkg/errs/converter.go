package errs

import "net/http"

// Error codes related to data converters
var (
	ErrNotFoundTransactionDataInFile       = NewNormalError(NormalSubcategoryConverter, 0, http.StatusBadRequest, "not found transaction data")
	ErrMissingRequiredFieldInHeaderRow     = NewNormalError(NormalSubcategoryConverter, 1, http.StatusBadRequest, "missing required field in header row")
	ErrFewerFieldsInDataRowThanInHeaderRow = NewNormalError(NormalSubcategoryConverter, 2, http.StatusBadRequest, "fewer fields in data row than in header row")
	ErrTransactionTimeInvalid              = NewNormalError(NormalSubcategoryConverter, 3, http.StatusBadRequest, "transaction time is invalid")
	ErrTransactionTimeZoneInvalid          = NewNormalError(NormalSubcategoryConverter, 4, http.StatusBadRequest, "transaction time zone is invalid")
	ErrAmountInvalid                       = NewNormalError(NormalSubcategoryConverter, 5, http.StatusBadRequest, "transaction amount is invalid")
	ErrGeographicLocationInvalid           = NewNormalError(NormalSubcategoryConverter, 6, http.StatusBadRequest, "geographic location is invalid")
	ErrFieldsInMultiTableAreDifferent      = NewNormalError(NormalSubcategoryConverter, 7, http.StatusBadRequest, "fields in multiple table headers are different")
	ErrInvalidFileHeader                   = NewNormalError(NormalSubcategoryConverter, 8, http.StatusBadRequest, "invalid file header")
	ErrInvalidCSVFile                      = NewNormalError(NormalSubcategoryConverter, 9, http.StatusBadRequest, "invalid csv file")
	ErrRelatedIdCannotBeBlank              = NewNormalError(NormalSubcategoryConverter, 10, http.StatusBadRequest, "related id cannot be blank")
	ErrFoundRecordNotHasRelatedRecord      = NewNormalError(NormalSubcategoryConverter, 11, http.StatusBadRequest, "found some transactions without related records")
	ErrInvalidQIFFile                      = NewNormalError(NormalSubcategoryConverter, 12, http.StatusBadRequest, "invalid qif file")
	ErrMissingTransactionTime              = NewNormalError(NormalSubcategoryConverter, 13, http.StatusBadRequest, "missing transaction time field")
	ErrInvalidGnuCashFile                  = NewNormalError(NormalSubcategoryConverter, 14, http.StatusBadRequest, "invalid gnucash file")
	ErrMissingAccountData                  = NewNormalError(NormalSubcategoryConverter, 15, http.StatusBadRequest, "missing account data")
	ErrNotSupportedSplitTransactions       = NewNormalError(NormalSubcategoryConverter, 16, http.StatusBadRequest, "not supported to import split transaction")
	ErrThereAreNotSupportedTransactionType = NewNormalError(NormalSubcategoryConverter, 17, http.StatusBadRequest, "there are not supported transaction type")
	ErrInvalidIIFFile                      = NewNormalError(NormalSubcategoryConverter, 18, http.StatusBadRequest, "invalid iif file")
	ErrInvalidOFXFile                      = NewNormalError(NormalSubcategoryConverter, 19, http.StatusBadRequest, "invalid ofx file")
	ErrInvalidSGMLFile                     = NewNormalError(NormalSubcategoryConverter, 20, http.StatusBadRequest, "invalid sgml file")
	ErrInvalidBeancountFile                = NewNormalError(NormalSubcategoryConverter, 21, http.StatusBadRequest, "invalid beancount file")
	ErrBeancountFileNotSupportInclude      = NewNormalError(NormalSubcategoryConverter, 22, http.StatusBadRequest, "not support include directive for beancount file")
	ErrInvalidAmountExpression             = NewNormalError(NormalSubcategoryConverter, 23, http.StatusBadRequest, "invalid amount expression")
	ErrInvalidXmlFile                      = NewNormalError(NormalSubcategoryConverter, 24, http.StatusBadRequest, "invalid xml file")
	ErrInvalidMT940File                    = NewNormalError(NormalSubcategoryConverter, 25, http.StatusBadRequest, "invalid mt940 file")
)
