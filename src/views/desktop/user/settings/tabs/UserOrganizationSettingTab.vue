<template>
    <v-row>
        <v-col cols="12">
            <!-- Current Organization Card -->
            <v-card :class="{ 'disabled': loading }">
                <template #title>
                    <span>{{ tt('Current Organization') }}</span>
                    <v-progress-circular indeterminate size="20" class="ms-3" v-if="loading"></v-progress-circular>
                </template>

                <v-card-text v-if="currentOrganization">
                    <div class="d-flex align-center mb-4">
                        <v-avatar color="primary" size="48" class="me-3">
                            <v-icon size="24" :icon="mdiDomain"/>
                        </v-avatar>
                        <div>
                            <div class="text-h6">{{ currentOrganization.name }}</div>
                            <div class="text-body-2 text-medium-emphasis">
                                {{ tt('Role') }}: {{ getOrganizationRoleName(currentOrganization.userRole) }}
                            </div>
                            <div class="text-body-2 text-medium-emphasis" v-if="currentOrganization.description">
                                {{ currentOrganization.description }}
                            </div>
                        </div>
                    </div>

                    <v-divider class="mb-4"/>

                    <div class="d-flex align-center justify-space-between">
                        <div>
                            <div class="text-body-1 font-weight-medium">{{ tt('Members') }}: {{ currentOrganization.memberCount || 1 }}</div>
                            <div class="text-body-2 text-medium-emphasis">{{ tt('Default Currency') }}: {{ currentOrganization.defaultCurrency }}</div>
                        </div>
                        <v-btn color="primary" variant="outlined" size="small" @click="showOrganizationDetails"
                               :disabled="loading">
                            {{ tt('Manage Organization') }}
                        </v-btn>
                    </div>
                </v-card-text>

                <v-card-text v-else-if="!loading">
                    <v-alert type="info" variant="tonal">
                        {{ tt('No organization found. Create one to collaborate with others.') }}
                    </v-alert>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Organization List Card -->
        <v-col cols="12" v-if="organizations.length > 1">
            <v-card :class="{ 'disabled': loading }">
                <template #title>
                    <span>{{ tt('My Organizations') }}</span>
                </template>

                <v-card-text>
                    <v-list>
                        <v-list-item v-for="org in organizations" :key="org.organizationId"
                                     :active="org.organizationId === currentOrganization?.organizationId">
                            <template #prepend>
                                <v-avatar color="primary" size="40">
                                    <v-icon size="20" :icon="mdiDomain"/>
                                </v-avatar>
                            </template>

                            <v-list-item-title>{{ org.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ tt('Role') }}: {{ getOrganizationRoleName(org.userRole) }}
                                <span v-if="org.memberCount"> • {{ org.memberCount }} {{ tt('members') }}</span>
                            </v-list-item-subtitle>

                            <template #append>
                                <v-btn color="primary" variant="text" size="small"
                                       @click="switchToOrganization(org as any)"
                                       :disabled="org.organizationId === currentOrganization?.organizationId || loading">
                                    {{ tt('Switch') }}
                                </v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Actions Card -->
        <v-col cols="12">
            <v-card :class="{ 'disabled': loading }">
                <template #title>
                    <span>{{ tt('Organization Actions') }}</span>
                </template>

                <v-card-text>
                    <div class="d-flex flex-wrap gap-3">
                        <v-btn color="primary" variant="elevated" @click="showCreateOrganizationDialog"
                               :disabled="loading">
                            <v-icon start :icon="mdiPlus"/>
                            {{ tt('Create Organization') }}
                        </v-btn>

                        <v-btn color="secondary" variant="outlined" @click="showJoinOrganizationDialog"
                               :disabled="loading">
                            <v-icon start :icon="mdiAccountPlus"/>
                            {{ tt('Join Organization') }}
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <!-- Create Organization Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500px" persistent>
        <v-card>
            <v-card-title>{{ tt('Create New Organization') }}</v-card-title>

            <v-card-text>
                <v-form ref="createForm" @submit.prevent="createOrganization">
                    <v-text-field
                        v-model="createForm.name"
                        :label="tt('Organization Name')"
                        :rules="[rules.required]"
                        maxlength="32"
                        variant="outlined"
                        class="mb-3"
                    />

                    <v-textarea
                        v-model="createForm.description"
                        :label="tt('Description (Optional)')"
                        maxlength="255"
                        rows="3"
                        variant="outlined"
                        class="mb-3"
                    />

                    <currency-select
                        v-model="createForm.defaultCurrency"
                        :label="tt('Default Currency')"
                        :rules="[rules.required]"
                        variant="outlined"
                    />
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer/>
                <v-btn @click="showCreateDialog = false" :disabled="creating">{{ tt('Cancel') }}</v-btn>
                <v-btn color="primary" @click="createOrganization" :loading="creating">{{ tt('Create') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Join Organization Dialog -->
    <v-dialog v-model="showJoinDialog" max-width="500px" persistent>
        <v-card>
            <v-card-title>{{ tt('Join Organization') }}</v-card-title>

            <v-card-text>
                <v-form ref="joinForm" @submit.prevent="joinOrganization">
                    <v-text-field
                        v-model="joinForm.inviteToken"
                        :label="tt('Invitation Token')"
                        :rules="[rules.required]"
                        variant="outlined"
                        placeholder="Enter invitation token..."
                    />
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer/>
                <v-btn @click="showJoinDialog = false" :disabled="joining">{{ tt('Cancel') }}</v-btn>
                <v-btn color="primary" @click="joinOrganization" :loading="joining">{{ tt('Join') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Organization Management Dialog -->
    <organization-management-dialog
        v-model="showManagementDialog"
        :organization="currentOrganization"
        @refresh="loadOrganizations"
    />

    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useOrganizationStore } from '@/stores/organization.ts';
import { useUserStore } from '@/stores/user.ts';
import CurrencySelect from '@/components/desktop/CurrencySelect.vue';
import OrganizationManagementDialog from '../dialogs/OrganizationManagementDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';
import type { OrganizationBasicInfo, OrganizationRole } from '@/models/organization.ts';
import { Organization } from '@/models/organization.ts';
import {
    mdiDomain,
    mdiPlus,
    mdiAccountPlus
} from '@mdi/js';

const { tt } = useI18n();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const snackbar = useTemplateRef<InstanceType<typeof SnackBar>>('snackbar');

const loading = ref(false);
const creating = ref(false);
const joining = ref(false);
const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const showManagementDialog = ref(false);

const createForm = ref({
    name: '',
    description: '',
    defaultCurrency: userStore.currentUserDefaultCurrency || 'USD'
});

const joinForm = ref({
    inviteToken: ''
});

const rules = {
    required: (value: string) => !!value || tt('This field is required')
};

const organizations = computed(() => organizationStore.organizations);
const currentOrganization = computed(() => organizationStore.currentOrganization);

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
    loading.value = true;
    try {
        await organizationStore.loadOrganizations();
    } catch (error) {
        snackbar.value?.showError('Failed to load organizations');
    } finally {
        loading.value = false;
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

        showCreateDialog.value = false;
        createForm.value = {
            name: '',
            description: '',
            defaultCurrency: userStore.currentUserDefaultCurrency || 'USD'
        };

        snackbar.value?.showMessage('Organization created successfully');
        await loadOrganizations();
    } catch (error) {
        snackbar.value?.showError('Failed to create organization');
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

        showJoinDialog.value = false;
        joinForm.value.inviteToken = '';

        snackbar.value?.showMessage('Successfully joined organization');
        await loadOrganizations();
    } catch (error) {
        snackbar.value?.showError('Failed to join organization');
    } finally {
        joining.value = false;
    }
};

const switchToOrganization = async (organization: OrganizationBasicInfo) => {
    try {
        organizationStore.setCurrentOrganization(Organization.of(organization));
        snackbar.value?.showMessage('Switched to organization: {name}', { name: organization.name });
    } catch (error) {
        snackbar.value?.showError('Failed to switch organization');
    }
};

const showOrganizationDetails = () => {
    showManagementDialog.value = true;
};

const showCreateOrganizationDialog = () => {
    showCreateDialog.value = true;
};

const showJoinOrganizationDialog = () => {
    showJoinDialog.value = true;
};

onMounted(() => {
    loadOrganizations();
});
</script>

<style scoped>
.disabled {
    pointer-events: none;
    opacity: 0.6;
}
</style>