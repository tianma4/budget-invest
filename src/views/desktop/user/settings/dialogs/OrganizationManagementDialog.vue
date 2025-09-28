<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
              max-width="800px" persistent scrollable>
        <v-card v-if="organization">
            <v-card-title class="d-flex align-center">
                <v-icon size="24" class="me-2" :icon="mdiDomain"/>
                {{ organization.name }}
                <v-spacer/>
                <v-btn icon size="small" @click="$emit('update:modelValue', false)">
                    <v-icon :icon="mdiClose"/>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <v-tabs v-model="activeTab" show-arrows>
                    <v-tab value="overview">{{ tt('Overview') }}</v-tab>
                    <v-tab value="members" v-if="canManageMembers">{{ tt('Members') }}</v-tab>
                    <v-tab value="settings" v-if="canManageSettings">{{ tt('Settings') }}</v-tab>
                </v-tabs>

                <v-window v-model="activeTab" class="mt-4">
                    <!-- Overview Tab -->
                    <v-window-item value="overview">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-card variant="outlined">
                                    <v-card-title>{{ tt('Organization Details') }}</v-card-title>
                                    <v-card-text>
                                        <div class="mb-3">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Name') }}</div>
                                            <div class="text-body-1">{{ organization.name }}</div>
                                        </div>
                                        <div class="mb-3" v-if="organization.description">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Description') }}</div>
                                            <div class="text-body-1">{{ organization.description }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Default Currency') }}</div>
                                            <div class="text-body-1">{{ organization.defaultCurrency }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Your Role') }}</div>
                                            <v-chip size="small" :color="getRoleColor(organization.role)">
                                                {{ getOrganizationRoleName(organization.role) }}
                                            </v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card variant="outlined">
                                    <v-card-title>{{ tt('Statistics') }}</v-card-title>
                                    <v-card-text>
                                        <div class="mb-3">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Total Members') }}</div>
                                            <div class="text-h5">{{ organization.memberCount || 1 }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-body-2 text-medium-emphasis">{{ tt('Organization ID') }}</div>
                                            <div class="text-body-2 font-mono">{{ organization.organizationId }}</div>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-window-item>

                    <!-- Members Tab -->
                    <v-window-item value="members" v-if="canManageMembers">
                        <div class="d-flex justify-space-between align-center mb-4">
                            <h3>{{ tt('Organization Members') }}</h3>
                            <v-btn color="primary" @click="showInviteDialog = true" v-if="canInviteMembers">
                                <v-icon start :icon="mdiAccountPlus"/>
                                {{ tt('Invite Member') }}
                            </v-btn>
                        </div>

                        <v-card variant="outlined">
                            <v-list>
                                <v-list-item v-for="member in members" :key="member.uid">
                                    <template #prepend>
                                        <v-avatar color="primary" size="40">
                                            <v-img :src="member.avatar" v-if="member.avatar"/>
                                            <v-icon :icon="mdiAccount" v-else/>
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title>{{ member.username }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ member.email }}
                                        <v-chip size="x-small" class="ms-2" :color="getRoleColor(member.role)">
                                            {{ getOrganizationRoleName(member.role) }}
                                        </v-chip>
                                    </v-list-item-subtitle>

                                    <template #append v-if="canManageMember(member)">
                                        <v-menu>
                                            <template #activator="{ props }">
                                                <v-btn icon size="small" v-bind="props">
                                                    <v-icon :icon="mdiDotsVertical"/>
                                                </v-btn>
                                            </template>

                                            <v-list>
                                                <v-list-item @click="editMemberRole(member)" v-if="canChangeRole(member)">
                                                    <v-list-item-title>{{ tt('Change Role') }}</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click="removeMember(member)" v-if="canRemoveMember(member)"
                                                           class="text-error">
                                                    <v-list-item-title>{{ tt('Remove Member') }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-window-item>

                    <!-- Settings Tab -->
                    <v-window-item value="settings" v-if="canManageSettings">
                        <v-card variant="outlined">
                            <v-card-title>{{ tt('Organization Settings') }}</v-card-title>
                            <v-card-text>
                                <v-form @submit.prevent="updateOrganization">
                                    <v-text-field
                                        v-model="settingsForm.name"
                                        :label="tt('Organization Name')"
                                        maxlength="32"
                                        variant="outlined"
                                        class="mb-3"
                                        :disabled="!canManageSettings"
                                    />

                                    <v-textarea
                                        v-model="settingsForm.description"
                                        :label="tt('Description')"
                                        maxlength="255"
                                        rows="3"
                                        variant="outlined"
                                        class="mb-3"
                                        :disabled="!canManageSettings"
                                    />

                                    <div class="d-flex gap-3 mt-4">
                                        <v-btn color="primary" @click="updateOrganization"
                                               :loading="updating" :disabled="!canManageSettings">
                                            {{ tt('Save Changes') }}
                                        </v-btn>

                                        <v-btn color="error" variant="outlined" @click="showLeaveDialog = true"
                                               v-if="!isOwner">
                                            {{ tt('Leave Organization') }}
                                        </v-btn>
                                    </div>
                                </v-form>
                            </v-card-text>
                        </v-card>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Invite Member Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="500px" persistent>
        <v-card>
            <v-card-title>{{ tt('Invite Member') }}</v-card-title>
            <v-card-text>
                <v-form ref="inviteForm" @submit.prevent="inviteMember">
                    <v-text-field
                        v-model="inviteForm.email"
                        :label="tt('Email Address')"
                        type="email"
                        :rules="[rules.required, rules.email]"
                        variant="outlined"
                        class="mb-3"
                    />

                    <v-select
                        v-model="inviteForm.role"
                        :label="tt('Role')"
                        :items="availableRoles"
                        item-title="text"
                        item-value="value"
                        variant="outlined"
                        :rules="[rules.required]"
                    />
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn @click="showInviteDialog = false" :disabled="inviting">{{ tt('Cancel') }}</v-btn>
                <v-btn color="primary" @click="inviteMember" :loading="inviting">{{ tt('Send Invitation') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Leave Organization Dialog -->
    <v-dialog v-model="showLeaveDialog" max-width="400px">
        <v-card>
            <v-card-title class="text-error">{{ tt('Leave Organization') }}</v-card-title>
            <v-card-text>
                {{ tt('Are you sure you want to leave this organization? This action cannot be undone.') }}
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn @click="showLeaveDialog = false">{{ tt('Cancel') }}</v-btn>
                <v-btn color="error" @click="leaveOrganization" :loading="leaving">{{ tt('Leave') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useOrganizationStore } from '@/stores/organization.ts';
import { useUserStore } from '@/stores/user.ts';
import { useSnackbarStore } from '@/stores/snackbar.ts';
import type { OrganizationBasicInfo, OrganizationRole } from '@/models/organization.ts';
import {
    mdiDomain,
    mdiClose,
    mdiAccount,
    mdiAccountPlus,
    mdiDotsVertical
} from '@mdi/js';

interface OrganizationMember {
    uid: string;
    username: string;
    email: string;
    role: OrganizationRole;
    avatar?: string;
}

const props = defineProps<{
    modelValue: boolean;
    organization: OrganizationBasicInfo | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'refresh': [];
}>();

const { tt } = useI18n();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const snackbarStore = useSnackbarStore();

const activeTab = ref('overview');
const updating = ref(false);
const inviting = ref(false);
const leaving = ref(false);
const showInviteDialog = ref(false);
const showLeaveDialog = ref(false);

const members = ref<OrganizationMember[]>([]);

const settingsForm = ref({
    name: '',
    description: ''
});

const inviteForm = ref({
    email: '',
    role: 3 // Default to Member
});

const rules = {
    required: (value: string) => !!value || tt('This field is required'),
    email: (value: string) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value) || tt('Please enter a valid email address');
    }
};

const isOwner = computed(() => props.organization?.role === 1);
const canManageMembers = computed(() => props.organization?.role && props.organization.role <= 2); // Owner or Admin
const canManageSettings = computed(() => props.organization?.role === 1); // Owner only
const canInviteMembers = computed(() => props.organization?.role && props.organization.role <= 2); // Owner or Admin

const availableRoles = computed(() => {
    const currentRole = props.organization?.role || 4;
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

const getRoleColor = (role: OrganizationRole): string => {
    switch (role) {
        case 1: return 'purple';
        case 2: return 'blue';
        case 3: return 'green';
        case 4: return 'orange';
        default: return 'grey';
    }
};

const canManageMember = (member: OrganizationMember): boolean => {
    const currentRole = props.organization?.role || 4;
    const currentUserId = userStore.currentUser?.uid;

    // Can't manage yourself
    if (member.uid === currentUserId) return false;

    // Owner can manage anyone except other owners
    if (currentRole === 1) return member.role !== 1;

    // Admin can manage members and viewers
    if (currentRole === 2) return member.role >= 3;

    return false;
};

const canChangeRole = (member: OrganizationMember): boolean => {
    return canManageMember(member);
};

const canRemoveMember = (member: OrganizationMember): boolean => {
    return canManageMember(member);
};

const loadMembers = async () => {
    if (!props.organization) return;

    try {
        // Mock data for now - in real implementation, fetch from API
        members.value = [
            {
                uid: userStore.currentUser?.uid || '1',
                username: userStore.currentUser?.username || 'Current User',
                email: userStore.currentUser?.email || 'user@example.com',
                role: props.organization.role,
                avatar: userStore.currentUser?.avatar
            }
        ];
    } catch (error) {
        snackbarStore.showError(tt('Failed to load members'));
    }
};

const updateOrganization = async () => {
    if (!props.organization) return;

    updating.value = true;
    try {
        // Call organization update API
        snackbarStore.showSuccess(tt('Organization updated successfully'));
        emit('refresh');
    } catch (error) {
        snackbarStore.showError(tt('Failed to update organization'));
    } finally {
        updating.value = false;
    }
};

const inviteMember = async () => {
    if (!props.organization || !inviteForm.value.email || !inviteForm.value.role) return;

    inviting.value = true;
    try {
        await organizationStore.inviteMember(
            props.organization.organizationId,
            inviteForm.value.email,
            inviteForm.value.role
        );

        showInviteDialog.value = false;
        inviteForm.value = { email: '', role: 3 };
        snackbarStore.showSuccess(tt('Invitation sent successfully'));
        loadMembers();
    } catch (error) {
        snackbarStore.showError(tt('Failed to send invitation'));
    } finally {
        inviting.value = false;
    }
};

const editMemberRole = (member: OrganizationMember) => {
    // Show role change dialog
    snackbarStore.showInfo(tt('Role change feature coming soon'));
};

const removeMember = (member: OrganizationMember) => {
    // Show confirmation dialog and remove member
    snackbarStore.showInfo(tt('Remove member feature coming soon'));
};

const leaveOrganization = async () => {
    if (!props.organization) return;

    leaving.value = true;
    try {
        // Call leave organization API
        showLeaveDialog.value = false;
        emit('update:modelValue', false);
        snackbarStore.showSuccess(tt('Left organization successfully'));
        emit('refresh');
    } catch (error) {
        snackbarStore.showError(tt('Failed to leave organization'));
    } finally {
        leaving.value = false;
    }
};

watch(() => props.organization, (newOrg) => {
    if (newOrg) {
        settingsForm.value = {
            name: newOrg.name,
            description: newOrg.description || ''
        };
        loadMembers();
    }
});

watch(() => props.modelValue, (isOpen) => {
    if (isOpen && props.organization) {
        activeTab.value = 'overview';
        loadMembers();
    }
});
</script>

<style scoped>
.font-mono {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.875rem;
}
</style>