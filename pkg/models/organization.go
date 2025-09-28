package models

// OrganizationRole represents the role of a user in an organization
type OrganizationRole byte

// Organization user roles
const (
	ORGANIZATION_ROLE_OWNER  OrganizationRole = 1
	ORGANIZATION_ROLE_ADMIN  OrganizationRole = 2
	ORGANIZATION_ROLE_MEMBER OrganizationRole = 3
	ORGANIZATION_ROLE_VIEWER OrganizationRole = 4
)

// String returns a textual representation of the organization role enum
func (r OrganizationRole) String() string {
	switch r {
	case ORGANIZATION_ROLE_OWNER:
		return "Owner"
	case ORGANIZATION_ROLE_ADMIN:
		return "Admin"
	case ORGANIZATION_ROLE_MEMBER:
		return "Member"
	case ORGANIZATION_ROLE_VIEWER:
		return "Viewer"
	default:
		return "Unknown"
	}
}

// Organization represents organization data stored in database
type Organization struct {
	OrganizationId     int64  `xorm:"PK"`
	Name               string `xorm:"VARCHAR(100) NOT NULL"`
	Description        string `xorm:"VARCHAR(255)"`
	DefaultCurrency    string `xorm:"VARCHAR(3) NOT NULL"`
	OwnerUid          int64  `xorm:"NOT NULL"`
	Deleted           bool   `xorm:"NOT NULL"`
	CreatedUnixTime   int64
	UpdatedUnixTime   int64
	DeletedUnixTime   int64
}

// UserOrganization represents the relationship between users and organizations
type UserOrganization struct {
	Uid             int64            `xorm:"NOT NULL"`
	OrganizationId  int64            `xorm:"NOT NULL"`
	Role            OrganizationRole `xorm:"TINYINT NOT NULL"`
	Invited         bool             `xorm:"NOT NULL"`
	InviteToken     string           `xorm:"VARCHAR(64)"`
	JoinedUnixTime  int64
	InvitedUnixTime int64
	CreatedUnixTime int64
	UpdatedUnixTime int64
}

// OrganizationBasicInfo represents a view-object of organization basic info
type OrganizationBasicInfo struct {
	OrganizationId  int64  `json:"organizationId,string"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	DefaultCurrency string `json:"defaultCurrency"`
	OwnerUid       int64  `json:"ownerUid,string"`
	UserRole       string `json:"userRole"`
	MemberCount    int    `json:"memberCount"`
}

// OrganizationMember represents organization member information
type OrganizationMember struct {
	Uid      int64  `json:"uid,string"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Nickname string `json:"nickname"`
	Role     string `json:"role"`
	Invited  bool   `json:"invited"`
}

// OrganizationCreateRequest represents all parameters of organization creation request
type OrganizationCreateRequest struct {
	Name            string `json:"name" binding:"required,notBlank,max=100"`
	Description     string `json:"description" binding:"max=255"`
	DefaultCurrency string `json:"defaultCurrency" binding:"required,len=3,validCurrency"`
}

// OrganizationUpdateRequest represents all parameters of organization update request
type OrganizationUpdateRequest struct {
	OrganizationId  int64  `json:"organizationId,string" binding:"required,min=1"`
	Name            string `json:"name" binding:"required,notBlank,max=100"`
	Description     string `json:"description" binding:"max=255"`
	DefaultCurrency string `json:"defaultCurrency" binding:"required,len=3,validCurrency"`
}

// OrganizationInviteRequest represents all parameters of organization invite request
type OrganizationInviteRequest struct {
	OrganizationId int64            `json:"organizationId,string" binding:"required,min=1"`
	Email          string           `json:"email" binding:"required,notBlank,max=100,validEmail"`
	Role           OrganizationRole `json:"role" binding:"required,min=1,max=4"`
}

// OrganizationMemberRoleUpdateRequest represents all parameters of organization member role update request
type OrganizationMemberRoleUpdateRequest struct {
	OrganizationId int64            `json:"organizationId,string" binding:"required,min=1"`
	Uid            int64            `json:"uid,string" binding:"required,min=1"`
	Role           OrganizationRole `json:"role" binding:"required,min=1,max=4"`
}

// OrganizationMemberRemoveRequest represents all parameters of organization member remove request
type OrganizationMemberRemoveRequest struct {
	OrganizationId int64 `json:"organizationId,string" binding:"required,min=1"`
	Uid            int64 `json:"uid,string" binding:"required,min=1"`
}

// OrganizationGetRequest represents all parameters of organization get request
type OrganizationGetRequest struct {
	OrganizationId int64 `form:"organizationId,string" binding:"required,min=1"`
}

// OrganizationAcceptInviteRequest represents all parameters of organization accept invite request
type OrganizationAcceptInviteRequest struct {
	InviteToken string `json:"inviteToken" binding:"required,notBlank"`
}

// ToOrganizationBasicInfo returns an organization basic view-object according to database model
func (o *Organization) ToOrganizationBasicInfo(userRole OrganizationRole, memberCount int) *OrganizationBasicInfo {
	return &OrganizationBasicInfo{
		OrganizationId:  o.OrganizationId,
		Name:            o.Name,
		Description:     o.Description,
		DefaultCurrency: o.DefaultCurrency,
		OwnerUid:       o.OwnerUid,
		UserRole:       userRole.String(),
		MemberCount:    memberCount,
	}
}

// CanManageMembers returns whether the user role can manage organization members
func (r OrganizationRole) CanManageMembers() bool {
	return r == ORGANIZATION_ROLE_OWNER || r == ORGANIZATION_ROLE_ADMIN
}

// CanModifyAccounts returns whether the user role can modify accounts
func (r OrganizationRole) CanModifyAccounts() bool {
	return r == ORGANIZATION_ROLE_OWNER || r == ORGANIZATION_ROLE_ADMIN || r == ORGANIZATION_ROLE_MEMBER
}

// CanViewAccounts returns whether the user role can view accounts
func (r OrganizationRole) CanViewAccounts() bool {
	return r == ORGANIZATION_ROLE_OWNER || r == ORGANIZATION_ROLE_ADMIN || r == ORGANIZATION_ROLE_MEMBER || r == ORGANIZATION_ROLE_VIEWER
}

// IsReadOnly returns whether the role has read-only access
func (r OrganizationRole) IsReadOnly() bool {
	return r == ORGANIZATION_ROLE_VIEWER
}