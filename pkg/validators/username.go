package validators

import (
	"github.com/go-playground/validator/v10"

	"github.com/mayswind/ezbookkeeping/pkg/utils"
)

// ValidUsername returns whether the given user name is valid
func ValidUsername(fl validator.FieldLevel) bool {
	if value, ok := fl.Field().Interface().(string); ok {
		if utils.IsValidUsername(value) {
			return true
		}
	}

	return false
}
