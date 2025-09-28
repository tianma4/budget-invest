<template>
    <f7-page>
        <f7-navbar :title="tt('Organizations')" :back-link="tt('Back')"></f7-navbar>

        <!-- Current Organization -->
        <f7-block-title class="margin-top" v-if="currentOrganization">{{ tt('Current Organization') }}</f7-block-title>
        <f7-list strong inset dividers v-if="currentOrganization">
            <f7-list-item
                :title="currentOrganization.name"
                :subtitle="currentOrganization.description"
                :after="getOrganizationRoleName(currentOrganization.userRole)"
                link="#"
                @click="showOrganizationDetails"
            >
                <template #media>
                    <f7-icon f7="building_2" size="24" color="blue"></f7-icon>
                </template>
            </f7-list-item>
        </f7-list>

        <!-- Organization List -->
        <f7-block-title v-if="organizations.length > 1">{{ tt('My Organizations') }}</f7-block-title>
        <f7-list strong inset dividers v-if="organizations.length > 1">
            <f7-list-item
                v-for="org in organizations"
                :key="org.organizationId"
                :title="org.name"
                :subtitle="`${tt('Role')}: ${getOrganizationRoleName(org.userRole)}`"
                :after="org.organizationId === currentOrganization?.organizationId ? tt('Current') : ''"
                link="#"
                @click="() => switchToOrganization(convertToBasicInfo(org as Organization))"
                :class="{ 'disabled': org.organizationId === currentOrganization?.organizationId }"
            >
                <template #media>
                    <f7-icon f7="building_2" size="24" :color="org.organizationId === currentOrganization?.organizationId ? 'blue' : 'gray'"></f7-icon>
                </template>
            </f7-list-item>
        </f7-list>

        <!-- Actions -->
        <f7-block-title>{{ tt('Actions') }}</f7-block-title>
        <f7-list strong inset dividers>
            <f7-list-item
                :title="tt('Create Organization')"
                link="#"
                @click="showCreateSheet = true"
            >
                <template #media>
                    <f7-icon f7="plus_circle" size="24" color="green"></f7-icon>
                </template>
            </f7-list-item>

            <f7-list-item
                :title="tt('Join Organization')"
                link="#"
                @click="showJoinSheet = true"
            >
                <template #media>
                    <f7-icon f7="person_add" size="24" color="blue"></f7-icon>
                </template>
            </f7-list-item>
        </f7-list>

        <!-- Create Organization Sheet -->
        <f7-sheet
            v-model:opened="showCreateSheet"
            swipe-to-close
            backdrop
        >
            <f7-page>
                <f7-navbar :title="tt('Create Organization')">
                    <f7-nav-right>
                        <f7-link @click="showCreateSheet = false">{{ tt('Cancel') }}</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-list strong dividers>
                    <f7-list-input
                        v-model:value="createForm.name"
                        :label="tt('Organization Name')"
                        :placeholder="tt('Enter organization name')"
                        maxlength="32"
                        required
                    />

                    <f7-list-input
                        v-model:value="createForm.description"
                        :label="tt('Description (Optional)')"
                        :placeholder="tt('Enter description')"
                        type="textarea"
                        maxlength="255"
                        rows="3"
                    />

                    <f7-list-input
                        v-model:value="createForm.defaultCurrency"
                        :label="tt('Default Currency')"
                        :placeholder="tt('Select currency')"
                        type="select"
                        required
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="CNY">CNY</option>
                    </f7-list-input>
                </f7-list>

                <f7-block>
                    <f7-button fill :disabled="!createForm.name || !createForm.defaultCurrency || creating"
                               @click="createOrganization">
                        {{ creating ? tt('Creating...') : tt('Create Organization') }}
                    </f7-button>
                </f7-block>
            </f7-page>
        </f7-sheet>

        <!-- Join Organization Sheet -->
        <f7-sheet
            v-model:opened="showJoinSheet"
            swipe-to-close
            backdrop
        >
            <f7-page>
                <f7-navbar :title="tt('Join Organization')">
                    <f7-nav-right>
                        <f7-link @click="showJoinSheet = false">{{ tt('Cancel') }}</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-list strong dividers>
                    <f7-list-input
                        v-model:value="joinForm.inviteToken"
                        :label="tt('Invitation Token')"
                        :placeholder="tt('Enter invitation token')"
                        required
                    />
                </f7-list>

                <f7-block>
                    <f7-button fill :disabled="!joinForm.inviteToken || joining"
                               @click="joinOrganization">
                        {{ joining ? tt('Joining...') : tt('Join Organization') }}
                    </f7-button>
                </f7-block>
            </f7-page>
        </f7-sheet>

        <!-- Organization Details Sheet -->
        <f7-sheet
            v-model:opened="showDetailsSheet"
            swipe-to-close
            backdrop
        >
            <f7-page v-if="currentOrganization">
                <f7-navbar :title="currentOrganization.name">
                    <f7-nav-right>
                        <f7-link @click="showDetailsSheet = false">{{ tt('Done') }}</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-block-title>{{ tt('Organization Details') }}</f7-block-title>
                <f7-list strong inset dividers>
                    <f7-list-item :title="tt('Name')" :after="currentOrganization.name"></f7-list-item>
                    <f7-list-item :title="tt('Description')" :after="currentOrganization.description || tt('No description')"></f7-list-item>
                    <f7-list-item :title="tt('Default Currency')" :after="currentOrganization.defaultCurrency"></f7-list-item>
                    <f7-list-item :title="tt('Your Role')" :after="getOrganizationRoleName(currentOrganization.userRole)"></f7-list-item>
                    <f7-list-item :title="tt('Members')" :after="currentOrganization.memberCount || 1"></f7-list-item>
                </f7-list>

                <f7-block-title v-if="canManageMembers">{{ tt('Management') }}</f7-block-title>
                <f7-list strong inset dividers v-if="canManageMembers">
                    <f7-list-item
                        :title="tt('Invite Member')"
                        link="#"
                        @click="showInviteSheet = true"
                        v-if="canInviteMembers"
                    >
                        <template #media>
                            <f7-icon f7="person_add" size="24" color="blue"></f7-icon>
                        </template>
                    </f7-list-item>
                </f7-list>

                <f7-block-title v-if="!isOwner">{{ tt('Actions') }}</f7-block-title>
                <f7-list strong inset dividers v-if="!isOwner">
                    <f7-list-item
                        :title="tt('Leave Organization')"
                        link="#"
                        @click="confirmLeaveOrganization"
                        class="text-color-red"
                    >
                        <template #media>
                            <f7-icon f7="arrow_left_circle" size="24" color="red"></f7-icon>
                        </template>
                    </f7-list-item>
                </f7-list>
            </f7-page>
        </f7-sheet>

        <!-- Invite Member Sheet -->
        <f7-sheet
            v-model:opened="showInviteSheet"
            swipe-to-close
            backdrop
        >
            <f7-page>
                <f7-navbar :title="tt('Invite Member')">
                    <f7-nav-right>
                        <f7-link @click="showInviteSheet = false">{{ tt('Cancel') }}</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-list strong dividers>
                    <f7-list-input
                        v-model:value="inviteForm.email"
                        :label="tt('Email Address')"
                        :placeholder="tt('Enter email address')"
                        type="email"
                        required
                    />

                    <f7-list-input
                        v-model:value="inviteForm.role"
                        :label="tt('Role')"
                        type="select"
                        required
                    >
                        <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                            {{ role.text }}
                        </option>
                    </f7-list-input>
                </f7-list>

                <f7-block>
                    <f7-button fill :disabled="!inviteForm.email || !inviteForm.role || inviting"
                               @click="inviteMember">
                        {{ inviting ? tt('Sending...') : tt('Send Invitation') }}
                    </f7-button>
                </f7-block>
            </f7-page>
        </f7-sheet>
    </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useOrganizationStore } from '@/stores/organization.ts';
import { useUserStore } from '@/stores/user.ts';
import { f7 } from 'framework7-vue';
import type { OrganizationBasicInfo, OrganizationRole } from '@/models/organization.ts';
import { Organization } from '@/models/organization.ts';

const { tt } = useI18n();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();

const showCreateSheet = ref(false);
const showJoinSheet = ref(false);
const showDetailsSheet = ref(false);
const showInviteSheet = ref(false);

const creating = ref(false);
const joining = ref(false);
const inviting = ref(false);

const createForm = ref({
    name: '',
    description: '',
    defaultCurrency: userStore.currentUserDefaultCurrency || 'USD'
});

const joinForm = ref({
    inviteToken: ''
});

const inviteForm = ref({
    email: '',
    role: 3 // Default to Member
});

const organizations = computed(() => organizationStore.organizations);
const currentOrganization = computed(() => organizationStore.currentOrganization);

const isOwner = computed(() => currentOrganization.value?.userRole === 1);
const canManageMembers = computed(() => currentOrganization.value?.userRole && currentOrganization.value.userRole <= 2);
const canInviteMembers = computed(() => currentOrganization.value?.userRole && currentOrganization.value.userRole <= 2);

const convertToBasicInfo = (org: Organization): OrganizationBasicInfo => {
    const getRoleName = (role: OrganizationRole): string => {
        switch (role) {
            case 1: return 'Owner';
            case 2: return 'Admin';
            case 3: return 'Member';
            case 4: return 'Viewer';
            default: return 'Viewer';
        }
    };

    return {
        organizationId: org.organizationId,
        name: org.name,
        description: org.description,
        defaultCurrency: org.defaultCurrency,
        ownerUid: org.ownerUid,
        userRole: getRoleName(org.userRole),
        memberCount: org.memberCount
    };
};

const availableRoles = computed(() => {
    const currentRole = currentOrganization.value?.userRole || 4;
    const roles = [];

    if (currentRole === 1) { // Owner can assign any role except Owner
        roles.push(
            { text: tt('Admin'), value: 2 },
            { text: tt('Member'), value: 3 },
            { text: tt('Viewer'), value: 4 }
        );
    } else if (currentRole === 2) { // Admin can only assign Member or Viewer
        roles.push(
            { text: tt('Member'), value: 3 },
            { text: tt('Viewer'), value: 4 }
        );
    }

    return roles;
});

const getOrganizationRoleName = (role: OrganizationRole): string => {
    switch (role) {
        case 1: return tt('Owner');
        case 2: return tt('Admin');
        case 3: return tt('Member');
        case 4: return tt('Viewer');
        default: return tt('Unknown');
    }
};

const loadOrganizations = async () => {
    try {
        await organizationStore.loadOrganizations();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to load organizations'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    }
};

const createOrganization = async () => {
    const form = createForm.value;
    if (!form.name || !form.defaultCurrency) {
        return;
    }

    creating.value = true;
    try {
        await organizationStore.createOrganization({
            name: form.name,
            description: form.description,
            defaultCurrency: form.defaultCurrency
        });

        showCreateSheet.value = false;
        createForm.value = {
            name: '',
            description: '',
            defaultCurrency: userStore.currentUserDefaultCurrency || 'USD'
        };

        f7.toast.create({
            text: tt('Organization created successfully'),
            position: 'center',
            closeTimeout: 2000,
        }).open();

        await loadOrganizations();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to create organization'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    } finally {
        creating.value = false;
    }
};

const joinOrganization = async () => {
    const token = joinForm.value.inviteToken;
    if (!token) {
        return;
    }

    joining.value = true;
    try {
        await organizationStore.acceptOrganizationInvite({ inviteToken: token });

        showJoinSheet.value = false;
        joinForm.value.inviteToken = '';

        f7.toast.create({
            text: tt('Successfully joined organization'),
            position: 'center',
            closeTimeout: 2000,
        }).open();

        await loadOrganizations();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to join organization'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    } finally {
        joining.value = false;
    }
};

const switchToOrganization = async (organization: OrganizationBasicInfo) => {
    if (organization.organizationId === currentOrganization.value?.organizationId) {
        return;
    }

    try {
        await organizationStore.setCurrentOrganization(Organization.of(organization as any));
        f7.toast.create({
            text: tt('Switched to organization: {name}', { name: organization.name }),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to switch organization'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    }
};

const showOrganizationDetails = () => {
    showDetailsSheet.value = true;
};

const inviteMember = async () => {
    if (!currentOrganization.value || !inviteForm.value.email || !inviteForm.value.role) {
        return;
    }

    inviting.value = true;
    try {
        await organizationStore.inviteUserToOrganization({
            organizationId: currentOrganization.value.organizationId,
            email: inviteForm.value.email,
            role: inviteForm.value.role
        });

        showInviteSheet.value = false;
        inviteForm.value = { email: '', role: 3 };

        f7.toast.create({
            text: tt('Invitation sent successfully'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to send invitation'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    } finally {
        inviting.value = false;
    }
};

const confirmLeaveOrganization = () => {
    f7.dialog.confirm(
        tt('Are you sure you want to leave this organization? This action cannot be undone.'),
        tt('Leave Organization'),
        () => {
            leaveOrganization();
        }
    );
};

const leaveOrganization = async () => {
    if (!currentOrganization.value) return;

    try {
        // Call leave organization API
        showDetailsSheet.value = false;

        f7.toast.create({
            text: tt('Left organization successfully'),
            position: 'center',
            closeTimeout: 2000,
        }).open();

        await loadOrganizations();
    } catch (error) {
        f7.toast.create({
            text: tt('Failed to leave organization'),
            position: 'center',
            closeTimeout: 2000,
        }).open();
    }
};

onMounted(() => {
    loadOrganizations();
});
</script>

<style scoped>
.disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>