import { defineStore } from 'pinia';
import { Organization } from '@/models/organization.ts';
import type { OrganizationBasicInfo, OrganizationCreateRequest, OrganizationInviteRequest, OrganizationAcceptInviteRequest } from '@/models/organization.ts';
import services from '@/lib/services.ts';

export interface OrganizationState {
    organizations: Organization[];
    currentOrganization: Organization | null;
    loading: boolean;
    error: string | null;
}

export const useOrganizationStore = defineStore('organization', {
    state: (): OrganizationState => ({
        organizations: [],
        currentOrganization: null,
        loading: false,
        error: null
    }),

    getters: {
        hasOrganizations(): boolean {
            return this.organizations.length > 0;
        },

        canCreateOrganization(): boolean {
            // Users can always create new organizations
            return true;
        },

        canManageCurrentOrganization(): boolean {
            return this.currentOrganization?.canManageMembers() ?? false;
        },

        canModifyAccounts(): boolean {
            return this.currentOrganization?.canModifyAccounts() ?? false;
        },

        isReadOnly(): boolean {
            return this.currentOrganization?.isReadOnly() ?? true;
        }
    },

    actions: {
        async loadOrganizations(): Promise<boolean> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.getOrganizations();
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    this.error = 'Failed to load organizations';
                    return false;
                }

                this.organizations = data.result.map((org: OrganizationBasicInfo) =>
                    Organization.of(org)
                );

                // Set the first organization as current if no current organization is set
                if (!this.currentOrganization && this.organizations.length > 0) {
                    this.currentOrganization = this.organizations[0];
                }

                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return false;
            } finally {
                this.loading = false;
            }
        },

        async createOrganization(organization: OrganizationCreateRequest): Promise<boolean> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.createOrganization(organization);
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    this.error = 'Failed to create organization';
                    return false;
                }

                const newOrganization = Organization.of(data.result);
                this.organizations.push(newOrganization);

                // Set the new organization as current
                this.currentOrganization = newOrganization;

                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return false;
            } finally {
                this.loading = false;
            }
        },

        async inviteUserToOrganization(invite: OrganizationInviteRequest): Promise<boolean> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.inviteToOrganization(invite);
                const data = response.data;

                if (!data || !data.success) {
                    this.error = 'Failed to invite user';
                    return false;
                }

                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return false;
            } finally {
                this.loading = false;
            }
        },

        async acceptOrganizationInvite(invite: OrganizationAcceptInviteRequest): Promise<boolean> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.acceptOrganizationInvite(invite);
                const data = response.data;

                if (!data || !data.success) {
                    this.error = 'Failed to accept invitation';
                    return false;
                }

                // Reload organizations to include the newly joined organization
                await this.loadOrganizations();

                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return false;
            } finally {
                this.loading = false;
            }
        },

        setCurrentOrganization(organization: Organization): void {
            this.currentOrganization = organization;

            // Store the current organization ID for persistence
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('currentOrganizationId', organization.organizationId);
            }
        },

        getCurrentOrganizationId(): string | null {
            return this.currentOrganization?.organizationId ?? null;
        },

        restoreCurrentOrganization(): void {
            if (typeof localStorage !== 'undefined') {
                const storedOrgId = localStorage.getItem('currentOrganizationId');

                if (storedOrgId && this.organizations.length > 0) {
                    const organization = this.organizations.find(org => org.organizationId === storedOrgId);
                    if (organization) {
                        this.currentOrganization = organization;
                    }
                }
            }
        },

        async inviteToOrganization(invite: OrganizationInviteRequest): Promise<boolean> {
            return this.inviteUserToOrganization(invite);
        },

        async getOrganizationMembers(organizationId: string): Promise<any[]> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.getOrganization({ organizationId });
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    this.error = 'Failed to load organization details';
                    return [];
                }

                // For now, return empty array as member details would require a separate API
                // This is a placeholder implementation
                return [];
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return [];
            } finally {
                this.loading = false;
            }
        },

        async removeOrganizationMember(request: { organizationId: string; uid: string }): Promise<boolean> {
            this.loading = true;
            this.error = null;

            try {
                const response = await services.removeOrganizationMember(request);
                const data = response.data;

                if (!data || !data.success) {
                    this.error = 'Failed to remove organization member';
                    return false;
                }

                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error occurred';
                return false;
            } finally {
                this.loading = false;
            }
        },

        clearError(): void {
            this.error = null;
        },

        reset(): void {
            this.organizations = [];
            this.currentOrganization = null;
            this.loading = false;
            this.error = null;

            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('currentOrganizationId');
            }
        }
    }
});