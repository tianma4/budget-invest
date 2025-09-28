export enum OrganizationRole {
    Owner = 1,
    Admin = 2,
    Member = 3,
    Viewer = 4
}

export class Organization {
    public organizationId: string = '';
    public name: string = '';
    public description: string = '';
    public defaultCurrency: string = '';
    public ownerUid: string = '';
    public userRole: OrganizationRole = OrganizationRole.Viewer;
    public memberCount: number = 0;

    public fillFrom(organization: OrganizationBasicInfo): void {
        this.organizationId = organization.organizationId;
        this.name = organization.name;
        this.description = organization.description;
        this.defaultCurrency = organization.defaultCurrency;
        this.ownerUid = organization.ownerUid;
        this.userRole = this.parseRole(organization.userRole);
        this.memberCount = organization.memberCount;
    }

    private parseRole(role: string): OrganizationRole {
        switch (role) {
            case 'Owner': return OrganizationRole.Owner;
            case 'Admin': return OrganizationRole.Admin;
            case 'Member': return OrganizationRole.Member;
            case 'Viewer': return OrganizationRole.Viewer;
            default: return OrganizationRole.Viewer;
        }
    }

    public canManageMembers(): boolean {
        return this.userRole === OrganizationRole.Owner || this.userRole === OrganizationRole.Admin;
    }

    public canModifyAccounts(): boolean {
        return this.userRole === OrganizationRole.Owner ||
               this.userRole === OrganizationRole.Admin ||
               this.userRole === OrganizationRole.Member;
    }

    public canViewAccounts(): boolean {
        return this.userRole === OrganizationRole.Owner ||
               this.userRole === OrganizationRole.Admin ||
               this.userRole === OrganizationRole.Member ||
               this.userRole === OrganizationRole.Viewer;
    }

    public isReadOnly(): boolean {
        return this.userRole === OrganizationRole.Viewer;
    }

    public toCreateRequest(): OrganizationCreateRequest {
        return {
            name: this.name,
            description: this.description,
            defaultCurrency: this.defaultCurrency
        };
    }

    public toUpdateRequest(): OrganizationUpdateRequest {
        return {
            organizationId: this.organizationId,
            name: this.name,
            description: this.description,
            defaultCurrency: this.defaultCurrency
        };
    }

    public static of(organizationInfo: OrganizationBasicInfo): Organization {
        const organization = new Organization();
        organization.fillFrom(organizationInfo);
        return organization;
    }

    public static createNewOrganization(): Organization {
        return new Organization();
    }
}

export interface OrganizationBasicInfo {
    readonly organizationId: string;
    readonly name: string;
    readonly description: string;
    readonly defaultCurrency: string;
    readonly ownerUid: string;
    readonly userRole: string;
    readonly memberCount: number;
}

export interface OrganizationCreateRequest {
    readonly name: string;
    readonly description: string;
    readonly defaultCurrency: string;
}

export interface OrganizationUpdateRequest {
    readonly organizationId: string;
    readonly name: string;
    readonly description: string;
    readonly defaultCurrency: string;
}

export interface OrganizationInviteRequest {
    readonly organizationId: string;
    readonly email: string;
    readonly role: OrganizationRole;
}

export interface OrganizationAcceptInviteRequest {
    readonly inviteToken: string;
}

export interface OrganizationMemberRoleUpdateRequest {
    readonly organizationId: string;
    readonly uid: string;
    readonly role: OrganizationRole;
}

export interface OrganizationMemberRemoveRequest {
    readonly organizationId: string;
    readonly uid: string;
}

export interface OrganizationMember {
    readonly uid: string;
    readonly username: string;
    readonly email: string;
    readonly nickname: string;
    readonly role: string;
    readonly invited: boolean;
}