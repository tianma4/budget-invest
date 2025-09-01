package errs

import "net/http"

// Error codes related to transaction categories
var (
	ErrSystemError           = NewSystemError(SystemSubcategoryDefault, 0, http.StatusInternalServerError, "system error")
	ErrApiNotFound           = NewSystemError(SystemSubcategoryDefault, 1, http.StatusNotFound, "api not found")
	ErrMethodNotAllowed      = NewSystemError(SystemSubcategoryDefault, 2, http.StatusMethodNotAllowed, "method not allowed")
	ErrNotImplemented        = NewSystemError(SystemSubcategoryDefault, 3, http.StatusNotImplemented, "not implemented")
	ErrSystemIsBusy          = NewSystemError(SystemSubcategoryDefault, 4, http.StatusServiceUnavailable, "system is busy")
	ErrNotSupported          = NewSystemError(SystemSubcategoryDefault, 5, http.StatusBadRequest, "not supported")
	ErrImageTypeNotSupported = NewSystemError(SystemSubcategoryDefault, 6, http.StatusBadRequest, "image type not supported")
)
