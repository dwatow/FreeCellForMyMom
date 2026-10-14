<script setup>
import { closeDialog, currentDialog } from '../composables/dialogs.js'
</script>

<template>
  <component
    :is="currentDialog.component"
    v-if="currentDialog"
    :key="currentDialog.id"
    v-bind="currentDialog.props"
    @close="closeDialog"
  />
</template>
