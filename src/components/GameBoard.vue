<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { canStack, cardsAt, foundationFor, isRunFrom, maxMovable, runLength, sameLoc, applyMove } from '../core/rules.js'
import { computeLayout, overlapArea } from '../composables/boardLayout.js'
import { openDialog } from '../composables/dialogs.js'
import { sound } from '../composables/sound.js'
import { useGameStore } from '../stores/game.js'
import { useSettingsStore } from '../stores/settings.js'
import ConfirmDialog from './ConfirmDialog.vue'
import PlayingCard from './PlayingCard.vue'

const emit = defineEmits(['celebrated'])

const game = useGameStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)

const root = ref(null)
const { width, height } = useElementSize(root)
const layout = computed(() => computeLayout(width.value, height.value, game.board))

/** 視窗縮放時牌直接跳到新位置，不跑移動動畫 */
const resizing = ref(false)
let resizeTimer = null
watch([width, height], () => {
  resizing.value = true
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => (resizing.value = false), 150)
})

const MOVE_MS = 200
const AUTO_STAGGER_MS = 110
const DEAL_STAGGER_MS = 28

/** 點選模式下目前選取的位置 */
const selected = ref(null)
/** 按下但還沒判定為拖曳或點擊 */
let press = null
let lastClick = null
/** 拖曳中：{ ids, loc, index, dx, dy } */
const drag = ref(null)
/** 正在飛行（移動動畫中）的牌：id → 延遲毫秒 */
const flying = ref(new Map())
/** 發牌動畫：null | 'stacked' | 'dealing' */
const dealPhase = ref(null)
const celebrating = ref(false)
/** 目前這批移動動畫預計結束的時間（performance.now） */
let flyingUntil = 0
const timers = new Set()

function later(fn, ms) {
  const t = setTimeout(() => {
    timers.delete(t)
    fn()
  }, ms)
  timers.add(t)
}
onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  clearTimeout(resizeTimer)
})

const busy = computed(() => dealPhase.value !== null || celebrating.value)

// ---------- 動畫 ----------

/** 依一步中的每個移動，算出被移動的牌與其動畫延遲 */
function markFlying(boardBefore, moves, reverse = false) {
  const map = new Map()
  let b = boardBefore
  const order = []
  for (const m of moves) {
    order.push(cardsAt(b, m.from).slice(-m.count))
    b = applyMove(b, m)
  }
  if (reverse) order.reverse()
  // 一次收很多張時縮短間隔，整串控制在約 1.5 秒內
  const stagger = Math.min(AUTO_STAGGER_MS, 1500 / order.length)
  order.forEach((ids, i) => ids.forEach((id) => map.set(id, i * stagger)))
  flying.value = map
  const total = (order.length - 1) * stagger + MOVE_MS + 50
  flyingUntil = performance.now() + total
  later(() => {
    if (flying.value === map) flying.value = new Map()
  }, total)
  return stagger
}

watch(
  () => game.steps,
  (now, prev) => {
    if (!settings.value.animation || dealPhase.value) return
    if (now.length === prev.length + 1) {
      const step = now[now.length - 1]
      const stagger = markFlying(game.boards[game.boards.length - 2], step)
      for (let i = 1; i < Math.min(step.length, 12); i++) later(() => sound.move(), i * stagger)
      return
    }
    if (now.length === prev.length - 1) markFlying(game.board, prev[prev.length - 1], true)
  },
)

function runDeal() {
  selected.value = null
  if (!settings.value.animation) {
    dealPhase.value = null
    return
  }
  dealPhase.value = 'stacked'
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      dealPhase.value = 'dealing'
      sound.deal()
      later(() => (dealPhase.value = null), 52 * DEAL_STAGGER_MS + 500)
    }),
  )
}

// 新局、重新開始時 boards[0] 會換成新的發牌結果
watch(
  () => game.boards[0],
  () => {
    celebrating.value = false
    if (game.steps.length === 0) runDeal()
  },
  { immediate: true },
)

watch(
  () => game.status,
  (status) => {
    if (status !== 'won') return
    selected.value = null
    if (!settings.value.animation) return emit('celebrated')
    // 等自動收牌的動畫跑完再開始慶祝
    later(() => {
      celebrating.value = true
      later(() => emit('celebrated'), 12 * 140 + 3 * 35 + 2200)
    }, Math.max(0, flyingUntil - performance.now()) + 100)
  },
)

// 提示亮 2 秒
watch(
  () => game.hint,
  (hint) => {
    if (hint) later(() => game.hint === hint && game.clearHint(), 2000)
  },
)

// ---------- 呈現 ----------

const hintIds = computed(() => {
  const h = game.hint
  if (!h) return new Set()
  const ids = cardsAt(game.board, h.from).slice(-h.count)
  const target = cardsAt(game.board, h.to)
  if (target.length) ids.push(target[target.length - 1])
  return new Set(ids)
})

const hintSlot = computed(() => {
  const h = game.hint
  return h && cardsAt(game.board, h.to).length === 0 ? h.to : null
})

const selectedId = computed(() => {
  if (!selected.value) return null
  const cards = cardsAt(game.board, selected.value)
  return cards.length ? cards[cards.length - 1] : null
})

/** 依發牌順序（逐列由左到右）的序號 */
const dealOrder = computed(() => {
  const order = new Map()
  game.boards[0].tableau.forEach((col, c) => col.forEach((id, r) => order.set(id, r * 8 + c)))
  return order
})

const cards = computed(() => {
  const L = layout.value
  const dragIds = drag.value ? new Set(drag.value.ids) : null
  return Array.from({ length: 52 }, (_, id) => {
    const pos = L.positions.get(id)
    let { x, y, z } = pos
    let transition = settings.value.animation && !resizing.value ? `transform ${MOVE_MS}ms ease-out` : 'none'
    let delay = 0
    let faceDown = false
    let flipDelay = 0

    if (dealPhase.value === 'stacked') {
      x = (L.width - L.cardW) / 2
      y = L.height + 10
      z = 200 - (dealOrder.value.get(id) ?? 0)
      transition = 'none'
      faceDown = true
    } else if (dealPhase.value === 'dealing') {
      delay = (dealOrder.value.get(id) ?? 0) * DEAL_STAGGER_MS
      flipDelay = delay + 150
      transition = 'transform 420ms cubic-bezier(.2,.7,.3,1)'
    } else if (dragIds?.has(id)) {
      x += drag.value.dx
      y += drag.value.dy
      z = 1000 + pos.index
      transition = 'none'
    } else if (flying.value.has(id)) {
      delay = flying.value.get(id)
      z = 800 + pos.index
    }

    return {
      id,
      faceDown,
      selected: id === selectedId.value,
      hinted: hintIds.value.has(id),
      celebrateDelay: pos.loc.type === 'foundation' ? (12 - pos.index) * 140 + pos.loc.index * 35 : 0,
      style: {
        width: `${L.cardW}px`,
        height: `${L.cardH}px`,
        transform: `translate(${x}px, ${y}px)`,
        zIndex: z,
        transition,
        transitionDelay: `${delay}ms`,
        '--flip-delay': `${flipDelay}ms`,
        '--flip-duration': dealPhase.value === 'dealing' ? '0.3s' : '0s',
      },
    }
  })
})

// ---------- 互動 ----------

function tryMove(move) {
  const step = game.move(move)
  step ? sound.move() : sound.invalid()
  return step
}

/** 點選模式：從 from 移到 to，自動決定張數；空欄時詢問移整列或一張 */
async function clickMove(from, to) {
  const board = game.board
  const source = cardsAt(board, from)
  let count = 1
  if (to.type === 'tableau') {
    const run = from.type === 'tableau' ? runLength(source) : 1
    const target = board.tableau[to.index]
    if (target.length === 0) {
      const max = Math.min(run, maxMovable(board, true))
      if (max > 1) {
        const choice = await openDialog(ConfirmDialog, {
          title: '移到空欄',
          message: '要把整列移到空欄，還是只移動一張牌？',
          buttons: [
            { id: 'column', label: '移動整列', primary: true },
            { id: 'single', label: '只移動一張' },
          ],
        })
        if (!choice) return
        count = choice === 'column' ? max : 1
      }
    } else {
      const top = target[target.length - 1]
      count = 0
      for (let k = 1; k <= run; k++) {
        if (canStack(top, source[source.length - k])) {
          count = k
          break
        }
      }
      if (!count) return sound.invalid()
    }
  }
  tryMove({ from, to, count })
}

function onClickLoc(loc) {
  if (busy.value || game.status === 'won') return
  game.clearHint()
  const current = selected.value
  if (!current) {
    if (loc.type !== 'foundation' && cardsAt(game.board, loc).length) selected.value = loc
    return
  }
  selected.value = null
  if (!sameLoc(current, loc)) clickMove(current, loc)
}

function onCardDown(e, id) {
  if (e.button !== 0 || busy.value || game.status === 'won') return
  const pos = layout.value.positions.get(id)
  press = { id, loc: pos.loc, index: pos.index, x: e.clientX, y: e.clientY, pointerId: e.pointerId }
  root.value?.setPointerCapture?.(e.pointerId)
}

function canDrag(loc, index) {
  if (loc.type === 'cell') return true
  return loc.type === 'tableau' && isRunFrom(game.board.tableau[loc.index], index)
}

function onPointerMove(e) {
  if (!press || e.pointerId !== press.pointerId) return
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  if (!drag.value) {
    if (Math.hypot(dx, dy) < 5 || !canDrag(press.loc, press.index)) return
    selected.value = null
    game.clearHint()
    drag.value = { ids: cardsAt(game.board, press.loc).slice(press.index), loc: press.loc, index: press.index, dx, dy }
    return
  }
  drag.value = { ...drag.value, dx, dy }
}

function dropTarget(d) {
  const L = layout.value
  const pos = L.positions.get(d.ids[0])
  const rect = { x: pos.x + d.dx, y: pos.y + d.dy, w: L.cardW, h: L.cardH }
  let best = null
  let bestArea = 0
  for (const { loc } of L.slots) {
    if (sameLoc(loc, d.loc)) continue
    const area = overlapArea(rect, L.dropRect(loc))
    if (area > bestArea) {
      best = loc
      bestArea = area
    }
  }
  return best
}

function onPointerUp(e) {
  if (!press || e.pointerId !== press.pointerId) return
  const d = drag.value
  const p = press
  press = null
  drag.value = null
  if (d) {
    const to = dropTarget(d)
    if (to) tryMove({ from: d.loc, to, count: d.ids.length })
    else sound.invalid()
    return
  }
  // 拖曳用了 pointer capture，原生 dblclick 不會落在牌上，所以自己判斷雙擊
  const now = performance.now()
  if (lastClick && lastClick.id === p.id && now - lastClick.time < 400) {
    lastClick = null
    onDoubleClick(p.id)
    return
  }
  lastClick = { id: p.id, time: now }
  onClickLoc(p.loc)
}

function onPointerCancel() {
  press = null
  drag.value = null
}

/** 雙擊：能收就收到回收區，否則放到暫存格 */
function onDoubleClick(id) {
  if (busy.value || game.status === 'won') return
  selected.value = null
  const pos = layout.value.positions.get(id)
  const pile = cardsAt(game.board, pos.loc)
  if (pos.loc.type === 'foundation' || pile[pile.length - 1] !== id) return
  const f = foundationFor(game.board, id)
  if (f >= 0) return tryMove({ from: pos.loc, to: { type: 'foundation', index: f }, count: 1 })
  const cell = game.board.cells.indexOf(null)
  if (pos.loc.type === 'tableau' && cell >= 0) return tryMove({ from: pos.loc, to: { type: 'cell', index: cell }, count: 1 })
  sound.invalid()
}

defineExpose({ clearSelection: () => (selected.value = null) })
</script>

<template>
  <div
    ref="root"
    class="board"
    :class="{ dragging: !!drag }"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div
      v-for="slot in layout.slots"
      :key="`${slot.loc.type}-${slot.loc.index}`"
      class="slot"
      :class="[slot.loc.type, { hinted: hintSlot && sameLoc(hintSlot, slot.loc) }]"
      :style="{ width: `${layout.cardW}px`, height: `${layout.cardH}px`, transform: `translate(${slot.x}px, ${slot.y}px)` }"
      @click="onClickLoc(slot.loc)"
    >
      <span v-if="slot.loc.type === 'foundation'" class="slot-mark">A</span>
    </div>

    <PlayingCard
      v-for="c in cards"
      :id="c.id"
      :key="c.id"
      :face-down="c.faceDown"
      :back="settings.cardBack"
      :selected="c.selected"
      :hinted="c.hinted"
      :compact="layout.compact"
      :class="{ celebrate: celebrating }"
      :style="{ ...c.style, '--celebrate-delay': `${c.celebrateDelay}ms` }"
      :data-card="c.id"
      @pointerdown="onCardDown($event, c.id)"
    />
  </div>
</template>

<style scoped>
.board {
  position: relative;
  flex: 1;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.board.dragging {
  cursor: grabbing;
}
.slot {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 7%;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.slot.tableau {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.06);
}
.slot.hinted {
  box-shadow: 0 0 0 3px #ffe14d, 0 0 12px 4px rgba(255, 225, 77, 0.85);
}
.slot-mark {
  font: 700 2.2em Georgia, serif;
  color: rgba(255, 255, 255, 0.22);
  pointer-events: none;
}
.celebrate :deep(.inner) {
  animation: celebrate 1.1s cubic-bezier(.3,.6,.4,1) var(--celebrate-delay) 2 alternate;
}
@keyframes celebrate {
  0% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-60px) rotate(-8deg) scale(1.08); }
  100% { transform: translateY(0) rotate(0); }
}
</style>
