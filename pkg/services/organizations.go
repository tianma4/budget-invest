package services

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/uuid"
)

// OrganizationService represents organization service
type OrganizationService struct {
	ServiceUsingDB
	ServiceUsingUuid
}

// Initialize an organization service singleton instance
var (
	Organizations = &OrganizationService{
		ServiceUsingDB: ServiceUsingDB{
			container: datastore.Container,
		},
		ServiceUsingUuid: ServiceUsingUuid{
			container: uuid.Container,
		},
	}
)

// GetUserOrganizations returns all organizations where the user is a member
func (s *OrganizationService) GetUserOrganizations(c core.Context, uid int64) ([]*models.OrganizationBasicInfo, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	var userOrganizations []*models.UserOrganization
	err := s.UserDB().NewSession(c).Where("uid=? AND invited=?", uid, false).Find(&userOrganizations)

	if err != nil {
		return nil, err
	}

	if len(userOrganizations) == 0 {
		return []*models.OrganizationBasicInfo{}, nil
	}

	organizationIds := make([]int64, len(userOrganizations))
	organizationRoles := make(map[int64]models.OrganizationRole)

	for i, userOrg := range userOrganizations {
		organizationIds[i] = userOrg.OrganizationId
		organizationRoles[userOrg.OrganizationId] = userOrg.Role
	}

	var organizations []*models.Organization
	err = s.UserDB().NewSession(c).In("organization_id", organizationIds).Where("deleted=?", false).Find(&organizations)

	if err != nil {
		return nil, err
	}

	result := make([]*models.OrganizationBasicInfo, len(organizations))

	for i, org := range organizations {
		memberCount, err := s.GetOrganizationMemberCount(c, org.OrganizationId)
		if err != nil {
			memberCount = 0
		}

		userRole := organizationRoles[org.OrganizationId]
		result[i] = org.ToOrganizationBasicInfo(userRole, memberCount)
	}

	return result, nil
}

// GetOrganizationByOrganizationId returns organization model according to organization id
func (s *OrganizationService) GetOrganizationByOrganizationId(c core.Context, organizationId int64) (*models.Organization, error) {
	if organizationId <= 0 {
		return nil, errs.ErrOrganizationIdInvalid
	}

	organization := &models.Organization{}
	has, err := s.UserDB().NewSession(c).Where("organization_id=? AND deleted=?", organizationId, false).Get(organization)

	if err != nil {
		return nil, err
	} else if !has {
		return nil, errs.ErrOrganizationNotFound
	}

	return organization, nil
}

// GetUserOrganizationRole returns the user's role in the organization
func (s *OrganizationService) GetUserOrganizationRole(c core.Context, uid int64, organizationId int64) (models.OrganizationRole, error) {
	if uid <= 0 {
		return 0, errs.ErrUserIdInvalid
	}

	if organizationId <= 0 {
		return 0, errs.ErrOrganizationIdInvalid
	}

	userOrganization := &models.UserOrganization{}
	has, err := s.UserDB().NewSession(c).Where("uid=? AND organization_id=? AND invited=?", uid, organizationId, false).Get(userOrganization)

	if err != nil {
		return 0, err
	} else if !has {
		return 0, errs.ErrUserNotInOrganization
	}

	return userOrganization.Role, nil
}

// GetOrganizationMemberCount returns the count of members in an organization
func (s *OrganizationService) GetOrganizationMemberCount(c core.Context, organizationId int64) (int, error) {
	if organizationId <= 0 {
		return 0, errs.ErrOrganizationIdInvalid
	}

	count, err := s.UserDB().NewSession(c).Where("organization_id=? AND invited=?", organizationId, false).Count(&models.UserOrganization{})

	return int(count), err
}

// CreateOrganization creates a new organization and adds the creator as owner
func (s *OrganizationService) CreateOrganization(c core.Context, organization *models.Organization, uid int64) (*models.Organization, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	now := time.Now().Unix()
	organization.OrganizationId = s.GenerateUuid(uuid.UUID_TYPE_ORGANIZATION)
	organization.OwnerUid = uid
	organization.Deleted = false
	organization.CreatedUnixTime = now
	organization.UpdatedUnixTime = now

	session := s.UserDB().NewSession(c)
	defer session.Close()

	err := session.Begin()
	if err != nil {
		return nil, err
	}

	// Create organization
	_, err = session.Insert(organization)
	if err != nil {
		session.Rollback()
		return nil, err
	}

	// Add creator as owner
	userOrganization := &models.UserOrganization{
		Uid:             uid,
		OrganizationId:  organization.OrganizationId,
		Role:            models.ORGANIZATION_ROLE_OWNER,
		Invited:         false,
		JoinedUnixTime:  now,
		CreatedUnixTime: now,
		UpdatedUnixTime: now,
	}

	_, err = session.Insert(userOrganization)
	if err != nil {
		session.Rollback()
		return nil, err
	}

	err = session.Commit()
	if err != nil {
		session.Rollback()
		return nil, err
	}

	return organization, nil
}

// InviteUserToOrganization creates an invitation for a user to join an organization
func (s *OrganizationService) InviteUserToOrganization(c core.Context, organizationId int64, inviterUid int64, inviteeEmail string, role models.OrganizationRole) error {
	if inviterUid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if organizationId <= 0 {
		return errs.ErrOrganizationIdInvalid
	}

	// Check if inviter has permission to invite
	inviterRole, err := s.GetUserOrganizationRole(c, inviterUid, organizationId)
	if err != nil {
		return err
	}

	if !inviterRole.CanManageMembers() {
		return errs.ErrNoPermission
	}

	// Find invitee user
	inviteeUser, err := Users.GetUserByEmail(c, inviteeEmail)
	if err != nil {
		return err
	}

	// Check if user is already a member
	_, err = s.GetUserOrganizationRole(c, inviteeUser.Uid, organizationId)
	if err == nil {
		return errs.ErrUserAlreadyInOrganization
	}

	// Generate invite token
	inviteTokenBytes := make([]byte, 32)
	rand.Read(inviteTokenBytes)
	inviteToken := hex.EncodeToString(inviteTokenBytes)

	now := time.Now().Unix()
	userOrganization := &models.UserOrganization{
		Uid:             inviteeUser.Uid,
		OrganizationId:  organizationId,
		Role:            role,
		Invited:         true,
		InviteToken:     inviteToken,
		InvitedUnixTime: now,
		CreatedUnixTime: now,
		UpdatedUnixTime: now,
	}

	_, err = s.UserDB().NewSession(c).Insert(userOrganization)
	return err
}

// AcceptOrganizationInvite accepts an organization invitation
func (s *OrganizationService) AcceptOrganizationInvite(c core.Context, uid int64, inviteToken string) error {
	if uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	userOrganization := &models.UserOrganization{}
	has, err := s.UserDB().NewSession(c).Where("uid=? AND invite_token=? AND invited=?", uid, inviteToken, true).Get(userOrganization)

	if err != nil {
		return err
	} else if !has {
		return errs.ErrInvalidInviteToken
	}

	now := time.Now().Unix()
	userOrganization.Invited = false
	userOrganization.InviteToken = ""
	userOrganization.JoinedUnixTime = now
	userOrganization.UpdatedUnixTime = now

	_, err = s.UserDB().NewSession(c).Where("uid=? AND organization_id=?", uid, userOrganization.OrganizationId).Update(userOrganization)
	return err
}

// UpdateOrganizationMemberRole updates a member's role in an organization
func (s *OrganizationService) UpdateOrganizationMemberRole(c core.Context, organizationId int64, updaterUid int64, targetUid int64, newRole models.OrganizationRole) error {
	if updaterUid <= 0 || targetUid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if organizationId <= 0 {
		return errs.ErrOrganizationIdInvalid
	}

	// Check if updater has permission
	updaterRole, err := s.GetUserOrganizationRole(c, updaterUid, organizationId)
	if err != nil {
		return err
	}

	if !updaterRole.CanManageMembers() {
		return errs.ErrNoPermission
	}

	// Cannot change owner role
	targetRole, err := s.GetUserOrganizationRole(c, targetUid, organizationId)
	if err != nil {
		return err
	}

	if targetRole == models.ORGANIZATION_ROLE_OWNER {
		return errs.ErrCannotChangeOwnerRole
	}

	now := time.Now().Unix()
	_, err = s.UserDB().NewSession(c).Where("uid=? AND organization_id=?", targetUid, organizationId).Update(&models.UserOrganization{
		Role:            newRole,
		UpdatedUnixTime: now,
	})

	return err
}

// RemoveUserFromOrganization removes a user from an organization
func (s *OrganizationService) RemoveUserFromOrganization(c core.Context, organizationId int64, removerUid int64, targetUid int64) error {
	if removerUid <= 0 || targetUid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if organizationId <= 0 {
		return errs.ErrOrganizationIdInvalid
	}

	// Check if remover has permission
	removerRole, err := s.GetUserOrganizationRole(c, removerUid, organizationId)
	if err != nil {
		return err
	}

	if !removerRole.CanManageMembers() {
		return errs.ErrNoPermission
	}

	// Cannot remove owner
	targetRole, err := s.GetUserOrganizationRole(c, targetUid, organizationId)
	if err != nil {
		return err
	}

	if targetRole == models.ORGANIZATION_ROLE_OWNER {
		return errs.ErrCannotRemoveOwner
	}

	_, err = s.UserDB().NewSession(c).Where("uid=? AND organization_id=?", targetUid, organizationId).Delete(&models.UserOrganization{})
	return err
}