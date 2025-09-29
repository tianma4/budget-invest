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
                <v-row>
                    <!-- Organization Info -->
                    <v-col cols="12">
                        <v-card variant="outlined" class="mb-4">
                            <v-card-title>{{ tt('Organization Details') }}</v-card-title>
                            <v-card-text>
                                <div class="mb-2"><strong>{{ tt('Name') }}:</strong> {{ organization.name }}</div>
                                <div class="mb-2"><strong>{{ tt('Description') }}:</strong> {{ organization.description || tt('No description') }}</div>
                                <div class="mb-2"><strong>{{ tt('Default Currency') }}:</strong> {{ organization.defaultCurrency }}</div>
                                <div class="mb-2"><strong>{{ tt('Members') }}:</strong> {{ organization.memberCount || 0 }}</div>
                                <div><strong>{{ tt('Your Role') }}:</strong> {{ getOrganizationRoleName(organization.userRole) }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <!-- Invite Members Section -->
                    <v-col cols="12" v-if="canInviteMembers">
                        <v-card variant="outlined" class="mb-4">
                            <v-card-title class="d-flex align-center">
                                <v-icon size="20" class="me-2" :icon="mdiAccountPlus"/>
                                {{ tt('Invite Members') }}
                            </v-card-title>
                            <v-card-text>
                                <v-form ref="inviteForm" @submit.prevent="inviteMember">
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-text-field
                                                v-model="inviteEmail"
                                                :label="tt('Email Address')"
                                                type="email"
                                                :rules="[rules.required, rules.email]"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-select
                                                v-model="inviteRole"
                                                :items="availableRoles"
                                                :label="tt('Role')"
                                                :rules="[rules.required]"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-btn
                                                color="primary"
                                                :loading="inviting"
                                                @click="inviteMember"
                                                block
                                            >
                                                {{ tt('Invite') }}
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-form>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <!-- Members List -->
                    <v-col cols="12">
                        <v-card variant="outlined">
                            <v-card-title class="d-flex align-center">
                                <v-icon size="20" class="me-2" :icon="mdiAccountGroup"/>
                                {{ tt('Members') }}
                                <v-spacer/>
                                <v-btn size="small" variant="text" @click="loadMembers" :loading="loadingMembers">
                                    <v-icon :icon="mdiRefresh"/>
                                </v-btn>
                            </v-card-title>
                            <v-card-text>
                                <v-list v-if="members.length > 0">
                                    <v-list-item v-for="member in members" :key="member.uid">
                                        <template #prepend>
                                            <v-avatar size="32" color="primary">
                                                <v-icon size="16" :icon="mdiAccount"/>
                                            </v-avatar>
                                        </template>

                                        <v-list-item-title>{{ member.nickname || member.username }}</v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{ member.email }} • {{ member.role }}
                                            <v-chip v-if="member.invited" size="x-small" color="warning" class="ms-2">
                                                {{ tt('Pending') }}
                                            </v-chip>
                                        </v-list-item-subtitle>

                                        <template #append v-if="canManageMembers && member.username !== userStore.currentUserBasicInfo?.username">
                                            <v-menu>
                                                <template #activator="{ props }">
                                                    <v-btn size="small" icon v-bind="props">
                                                        <v-icon :icon="mdiDotsVertical"/>
                                                    </v-btn>
                                                </template>
                                                <v-list>
                                                    <v-list-item @click="removeMember(member)" class="text-error">
                                                        <v-list-item-title>{{ tt('Remove') }}</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </template>
                                    </v-list-item>
                                </v-list>
                                <v-alert v-else type="info" variant="tonal">
                                    {{ tt('No members found.') }}
                                </v-alert>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer/>
                <v-btn @click="$emit('update:modelValue', false)">
                    {{ tt('Close') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useOrganizationStore } from '@/stores/organization.ts';
import { useUserStore } from '@/stores/user.ts';
import type { OrganizationRole } from '@/models/organization.ts';
import {
    mdiDomain,
    mdiClose,
    mdiAccountPlus,
    mdiAccountGroup,
    mdiAccount,
    mdiRefresh,
    mdiDotsVertical
} from '@mdi/js';

const props = defineProps<{
    modelValue: boolean;
    organization: any;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'refresh'): void;
}>();

const { tt } = useI18n();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();

const inviting = ref(false);
const loadingMembers = ref(false);
const inviteEmail = ref('');
const inviteRole = ref(3); // Default to Member
const members = ref<any[]>([]);

const rules = {
    required: (value: string) => !!value || tt('This field is required'),
    email: (value: string) => /.+@.+\..+/.test(value) || tt('Invalid email address')
};

const canInviteMembers = computed(() => {
    return props.organization?.userRole && props.organization.userRole <= 2; // Owner or Admin
});

const canManageMembers = computed(() => {
    return props.organization?.userRole && props.organization.userRole <= 2; // Owner or Admin
});

const availableRoles = computed(() => {
    const currentRole = props.organization?.userRole || 4;
    const roles = [];

    if (currentRole === 1) { // Owner can assign any role except Owner
        roles.push(
            { text: tt('Admin'), value: 2 },
            { text: tt('Member'), value: 3 },
            { text: tt('Viewer'), value: 4 }
        );
    } else if (currentRole === 2) { // Admin can assign Member or Viewer
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

const inviteMember = async () => {
    if (!inviteEmail.value || !inviteRole.value || !props.organization) {
        return;
    }

    inviting.value = true;
    try {
        await organizationStore.inviteToOrganization({
            organizationId: props.organization.organizationId,
            email: inviteEmail.value,
            role: inviteRole.value
        });

        inviteEmail.value = '';
        inviteRole.value = 3;

        // Reload members after successful invite
        await loadMembers();
        emit('refresh');
    } catch (error) {
        console.error('Failed to invite member:', error);
    } finally {
        inviting.value = false;
    }
};

const loadMembers = async () => {
    if (!props.organization) return;

    loadingMembers.value = true;
    try {
        members.value = await organizationStore.getOrganizationMembers(props.organization.organizationId);
    } catch (error) {
        console.error('Failed to load members:', error);
        members.value = [];
    } finally {
        loadingMembers.value = false;
    }
};

const removeMember = async (member: any) => {
    if (!props.organization) return;

    try {
        await organizationStore.removeOrganizationMember({
            organizationId: props.organization.organizationId,
            uid: member.uid
        });

        await loadMembers();
        emit('refresh');
    } catch (error) {
        console.error('Failed to remove member:', error);
    }
};

// Load members when dialog opens
watch(() => props.modelValue, (newValue) => {
    if (newValue && props.organization) {
        loadMembers();
    }
});
</script>