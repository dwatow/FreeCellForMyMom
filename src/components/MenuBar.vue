<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  canUndo: { type: Boolean, default: false },
})
const emit = defineEmits(['action'])

const menus = [
  {
    id: 'game',
    label: '遊戲',
    key: 'G',
    items: [
      { id: 'new', label: '新局', shortcut: 'F2' },
      { id: 'restart', label: '重新開始此局' },
      { id: 'select', label: '選擇遊戲…', shortcut: 'F3' },
      null,
      { id: 'undo', label: '復原', shortcut: 'Ctrl+Z', needsUndo: true },
      { id: 'hint', label: '提示', shortcut: 'H' },
      null,
      { id: 'stats', label: '統計資料', shortcut: 'F4' },
      { id: 'options', label: '選項…', shortcut: 'F5' },
      { id: 'appearance', label: '變更外觀…', shortcut: 'F7' },
    ],
  },
  {
    id: 'help',
    label: '說明',
    key: 'H',
    items: [{ id: 'about', label: '關於新接龍與玩法' }],
  },
]

const open = ref(null)
const bar = ref(null)

function choose(item) {
  if (item.needsUndo && !props.canUndo) return
  open.value = null
  emit('action', item.id)
}

function onDocumentPointer(e) {
  if (open.value && !bar.value?.contains(e.target)) open.value = null
}
function onKey(e) {
  if (e.key === 'Escape') open.value = null
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <nav ref="bar" class="menubar" role="menubar">
    <div v-for="menu in menus" :key="menu.id" class="menu">
      <button
        class="menu-title"
        :class="{ open: open === menu.id }"
        role="menuitem"
        aria-haspopup="true"
        :aria-expanded="open === menu.id"
        @click="open = open === menu.id ? null : menu.id"
        @pointerenter="open && (open = menu.id)"
      >
        {{ menu.label }}(<u>{{ menu.key }}</u>)
      </button>
      <ul v-if="open === menu.id" class="dropdown" role="menu">
        <template v-for="(item, i) in menu.items" :key="i">
          <li v-if="!item" class="separator" role="separator" />
          <li v-else role="none">
            <button
              class="item"
              role="menuitem"
              :disabled="item.needsUndo && !canUndo"
              @click="choose(item)"
            >
              <span>{{ item.label }}</span>
              <span class="shortcut">{{ item.shortcut }}</span>
            </button>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.menubar {
  display: flex;
  height: 22px;
  background: linear-gradient(to bottom, #fcfdfe, #e7eef7 50%, #dce6f4 51%, #dde9f7);
  border-bottom: 1px solid #b6bccc;
  font-size: 12px;
  position: relative;
  z-index: 3000;
}
.menu {
  position: relative;
}
.menu-title {
  height: 100%;
  padding: 0 8px;
  border: 1px solid transparent;
  background: none;
  font: inherit;
  color: #1e1e1e;
  cursor: default;
}
.menu-title:hover,
.menu-title.open {
  border-color: #a8d8eb;
  border-radius: 2px;
  background: linear-gradient(to bottom, #f2f9fd, #d5ecf8);
}
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 220px;
  margin: 0;
  padding: 2px;
  list-style: none;
  background: #f0f0f0;
  border: 1px solid #979797;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
.item {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 4px 12px 4px 28px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  font: inherit;
  text-align: left;
  color: #1e1e1e;
}
.item:hover:not(:disabled) {
  background: linear-gradient(to bottom, rgba(232, 242, 252, 0.9), rgba(205, 226, 248, 0.9));
  border-color: #aeccef;
}
.item:disabled {
  color: #9a9a9a;
}
.shortcut {
  color: inherit;
}
.separator {
  height: 1px;
  margin: 3px 2px 3px 26px;
  background: #d7d7d7;
  border-bottom: 1px solid #fff;
}
</style>
