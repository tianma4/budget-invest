<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-title>{{ tt('Organization Settings') }}</v-card-title>
                <v-card-text>
                    <p>Organization features test page</p>
                    <p>Current organization: {{ currentOrganization?.name || 'None' }}</p>
                    <p>Organizations count: {{ organizations.length }}</p>
                    <p>Loading: {{ loading }}</p>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales/helpers.ts';
import { useOrganizationStore } from '@/stores/organization.ts';
import { Organization } from '@/models/organization.ts';

const { tt } = useI18n();
const organizationStore = useOrganizationStore();

console.log('UserOrganizationSettingTab mounted');

const loading = ref(false);

const organizations = computed(() => organizationStore.organizations);
const currentOrganization = computed(() => organizationStore.currentOrganization as Organization | null);

const loadOrganizations = async () => {
    loading.value = true;
    try {
        await organizationStore.loadOrganizations();
    } catch {
        console.error('Failed to load organizations');
    } finally {
        loading.value = false;
    }
};


onMounted(() => {
    console.log('onMounted called');
    loadOrganizations();
});
</script>