<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
              max-width="600px" persistent scrollable>
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
                <v-alert type="info" class="mb-4">
                    Organization management is coming soon! This feature is still being developed.
                </v-alert>

                <p><strong>Organization:</strong> {{ organization.name }}</p>
                <p><strong>Description:</strong> {{ organization.description || 'No description' }}</p>
                <p><strong>Default Currency:</strong> {{ organization.defaultCurrency }}</p>
                <p><strong>Members:</strong> {{ organization.memberCount || 0 }}</p>
            </v-card-text>

            <v-card-actions>
                <v-spacer/>
                <v-btn color="primary" @click="$emit('update:modelValue', false)">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { mdiDomain, mdiClose } from '@mdi/js';

defineProps<{
    modelValue: boolean;
    organization: any;
}>();

defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'refresh'): void;
}>();
</script>