package errs

import "net/http"

// Organization error codes
var (
	ErrOrganizationIdInvalid         = NewNormalError(NormalSubcategoryOrganization, 0, http.StatusBadRequest, "organization id is invalid")
	ErrOrganizationNotFound          = NewNormalError(NormalSubcategoryOrganization, 1, http.StatusNotFound, "organization not found")
	ErrUserNotInOrganization         = NewNormalError(NormalSubcategoryOrganization, 2, http.StatusForbidden, "user is not a member of this organization")
	ErrUserAlreadyInOrganization     = NewNormalError(NormalSubcategoryOrganization, 3, http.StatusBadRequest, "user is already a member of this organization")
	ErrInvalidInviteToken            = NewNormalError(NormalSubcategoryOrganization, 4, http.StatusBadRequest, "invalid invite token")
	ErrCannotChangeOwnerRole         = NewNormalError(NormalSubcategoryOrganization, 5, http.StatusForbidden, "cannot change owner role")
	ErrCannotRemoveOwner             = NewNormalError(NormalSubcategoryOrganization, 6, http.StatusForbidden, "cannot remove organization owner")
	ErrNoPermission                  = NewNormalError(NormalSubcategoryOrganization, 7, http.StatusForbidden, "no permission to perform this action")
)