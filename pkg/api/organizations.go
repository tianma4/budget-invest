package api

import (
	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/log"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/services"
)

// OrganizationsApi represents organization api
type OrganizationsApi struct {
	organizationService *services.OrganizationService
}

// Initialize a organization api singleton instance
var (
	Organizations = &OrganizationsApi{
		organizationService: services.Organizations,
	}
)

// OrganizationListHandler returns user's organizations list
func (a *OrganizationsApi) OrganizationListHandler(c *core.WebContext) (any, *errs.Error) {
	uid := c.GetCurrentUid()

	organizations, err := a.organizationService.GetUserOrganizations(c, uid)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationListHandler] failed to get organizations for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	return organizations, nil
}

// OrganizationGetHandler returns specific organization info
func (a *OrganizationsApi) OrganizationGetHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationGetRequest
	err := c.ShouldBindQuery(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationGetHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	// Check if user has access to the organization
	userRole, err := a.organizationService.GetUserOrganizationRole(c, uid, credential.OrganizationId)
	if err != nil {
		log.Errorf(c, "[organizations.OrganizationGetHandler] failed to get user role for user \"uid:%d\" in organization \"%d\", because %s", uid, credential.OrganizationId, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if !userRole.CanViewAccounts() {
		return nil, errs.ErrNoPermission
	}

	organization, err := a.organizationService.GetOrganizationByOrganizationId(c, credential.OrganizationId)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationGetHandler] failed to get organization \"%d\", because %s", credential.OrganizationId, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	memberCount, _ := a.organizationService.GetOrganizationMemberCount(c, credential.OrganizationId)
	organizationInfo := organization.ToOrganizationBasicInfo(userRole, memberCount)

	return organizationInfo, nil
}

// OrganizationCreateHandler creates a new organization
func (a *OrganizationsApi) OrganizationCreateHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationCreateRequest
	err := c.ShouldBindJSON(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationCreateHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	organization := &models.Organization{
		Name:            credential.Name,
		Description:     credential.Description,
		DefaultCurrency: credential.DefaultCurrency,
	}

	createdOrganization, err := a.organizationService.CreateOrganization(c, organization, uid)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationCreateHandler] failed to create organization for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	organizationInfo := createdOrganization.ToOrganizationBasicInfo(models.ORGANIZATION_ROLE_OWNER, 1)

	return organizationInfo, nil
}

// OrganizationInviteHandler invites a user to join an organization
func (a *OrganizationsApi) OrganizationInviteHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationInviteRequest
	err := c.ShouldBindJSON(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationInviteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	err = a.organizationService.InviteUserToOrganization(c, credential.OrganizationId, uid, credential.Email, credential.Role)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationInviteHandler] failed to invite user to organization \"%d\" by user \"uid:%d\", because %s", credential.OrganizationId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	return true, nil
}

// OrganizationAcceptInviteHandler accepts an organization invitation
func (a *OrganizationsApi) OrganizationAcceptInviteHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationAcceptInviteRequest
	err := c.ShouldBindJSON(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationAcceptInviteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	err = a.organizationService.AcceptOrganizationInvite(c, uid, credential.InviteToken)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationAcceptInviteHandler] failed to accept organization invite for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	return true, nil
}

// OrganizationMemberRoleUpdateHandler updates a member's role in an organization
func (a *OrganizationsApi) OrganizationMemberRoleUpdateHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationMemberRoleUpdateRequest
	err := c.ShouldBindJSON(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationMemberRoleUpdateHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	err = a.organizationService.UpdateOrganizationMemberRole(c, credential.OrganizationId, uid, credential.Uid, credential.Role)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationMemberRoleUpdateHandler] failed to update member role in organization \"%d\" by user \"uid:%d\", because %s", credential.OrganizationId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	return true, nil
}

// OrganizationMemberRemoveHandler removes a member from an organization
func (a *OrganizationsApi) OrganizationMemberRemoveHandler(c *core.WebContext) (any, *errs.Error) {
	var credential models.OrganizationMemberRemoveRequest
	err := c.ShouldBindJSON(&credential)

	if err != nil {
		log.Warnf(c, "[organizations.OrganizationMemberRemoveHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	err = a.organizationService.RemoveUserFromOrganization(c, credential.OrganizationId, uid, credential.Uid)

	if err != nil {
		log.Errorf(c, "[organizations.OrganizationMemberRemoveHandler] failed to remove member from organization \"%d\" by user \"uid:%d\", because %s", credential.OrganizationId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	return true, nil
}