<script setup>
import BaseDialog from './BaseDialog.vue'

defineProps({
  title: { type: String, default: '新接龍' },
  message: { type: String, required: true },
  /** @type {{ id: string, label: string, primary?: boolean }[]} */
  buttons: { type: Array, default: () => [{ id: 'ok', label: '確定', primary: true }] },
})
const emit = defineEmits(['close'])
</script>

<template>
  <BaseDialog :title="title" @close="emit('close', $event)">
    <p class="message">{{ message }}</p>
    <template #footer>
      <button v-for="b in buttons" :key="b.id" class="btn" :class="{ primary: b.primary }" @click="emit('close', b.id)">
        {{ b.label }}
      </button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.message {
  margin: 4px 0;
  line-height: 1.6;
  white-space: pre-line;
}
</style>
