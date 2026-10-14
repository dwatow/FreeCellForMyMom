<script setup>
import { computed } from 'vue'
import { cardLabel, isRed, rankOf, RANK_LABELS, suitOf } from '../core/cards.js'

const props = defineProps({
  id: { type: Number, required: true },
  faceDown: { type: Boolean, default: false },
  back: { type: String, default: 'blue' },
  selected: { type: Boolean, default: false },
  hinted: { type: Boolean, default: false },
  /** 牌很小時放大角落的點數與花色 */
  compact: { type: Boolean, default: false },
})

/** 點數牌的花色排列，座標為 0～1 的相對位置 */
const PIPS = {
  2: [[0.5, 0], [0.5, 1]],
  3: [[0.5, 0], [0.5, 0.5], [0.5, 1]],
  4: [[0, 0], [1, 0], [0, 1], [1, 1]],
  5: [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]],
  6: [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  7: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  8: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0.5, 0.75], [0, 1], [1, 1]],
  9: [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [0.5, 0.5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
  10: [[0, 0], [1, 0], [0.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [0.5, 5 / 6], [0, 1], [1, 1]],
}
const PIP = 19

const rank = computed(() => rankOf(props.id))
const suit = computed(() => suitOf(props.id))
const color = computed(() => (isRed(props.id) ? '#c8102e' : '#141414'))
const label = computed(() => RANK_LABELS[rank.value])
const pips = computed(() =>
  (PIPS[rank.value] ?? []).map(([px, py]) => ({
    x: 31 + px * 38 - PIP / 2,
    y: 27 + py * 86 - PIP / 2,
    flip: py > 0.5,
  })),
)
const face = computed(() => rank.value > 10)
</script>

<template>
  <div class="card" :class="{ selected, hinted }" :aria-label="cardLabel(id)" role="img">
    <div class="inner" :class="{ down: faceDown }">
      <svg class="side front" viewBox="0 0 100 140" :style="{ color }">
        <rect x="0.75" y="0.75" width="98.5" height="138.5" rx="7" fill="url(#card-sheen)" stroke="#8a8a8a" stroke-width="1.2" />
        <g v-for="flip in compact ? [false] : [false, true]" :key="String(flip)" :transform="flip ? 'rotate(180 50 70)' : undefined">
          <template v-if="compact">
            <text x="17" y="28" text-anchor="middle" class="rank big" :class="{ ten: rank === 10 }" fill="currentColor">{{ label }}</text>
            <use :href="`#suit-${suit}`" x="36" y="9" width="22" height="22" fill="currentColor" />
          </template>
          <template v-else>
            <text x="11" y="19" text-anchor="middle" class="rank" :class="{ ten: rank === 10 }" fill="currentColor">{{ label }}</text>
            <use :href="`#suit-${suit}`" x="5" y="23" width="12" height="12" fill="currentColor" />
          </template>
        </g>

        <use v-if="compact" :href="`#suit-${suit}`" x="22" y="58" width="56" height="56" fill="currentColor" />

        <use v-else-if="rank === 1" :href="`#suit-${suit}`" :x="suit === 3 ? 26 : 31" :y="suit === 3 ? 46 : 51" :width="suit === 3 ? 48 : 38" :height="suit === 3 ? 48 : 38" fill="currentColor" />

        <template v-else-if="!face">
          <use
            v-for="(p, i) in pips"
            :key="i"
            :href="`#suit-${suit}`"
            :x="p.x"
            :y="p.y"
            :width="PIP"
            :height="PIP"
            fill="currentColor"
            :transform="p.flip ? `rotate(180 ${p.x + PIP / 2} ${p.y + PIP / 2})` : undefined"
          />
        </template>

        <template v-else>
          <rect x="20" y="16" width="60" height="108" rx="3" fill="url(#face-bg)" stroke="currentColor" stroke-width="1.4" />
          <rect x="23" y="19" width="54" height="102" rx="2" fill="none" stroke="#c9a54a" stroke-width="0.8" />
          <g v-for="flip in [false, true]" :key="'f' + flip" :transform="flip ? 'rotate(180 50 70)' : undefined">
            <path v-if="rank === 13" d="M37 50 L39 36 L45 43 L50 32 L55 43 L61 36 L63 50 Z" fill="#e0ad2c" stroke="#7a5600" stroke-width="1" />
            <g v-else-if="rank === 12">
              <path d="M38 50 L40 39 L45 45 L50 37 L55 45 L60 39 L62 50 Z" fill="#e0ad2c" stroke="#7a5600" stroke-width="1" />
              <circle cx="40" cy="38" r="2" fill="#c8102e" />
              <circle cx="50" cy="36" r="2" fill="#1d4f9e" />
              <circle cx="60" cy="38" r="2" fill="#c8102e" />
            </g>
            <path v-else d="M40 50 C41 40 48 34 58 33 C54 38 54 44 60 50 Z" fill="#e0ad2c" stroke="#7a5600" stroke-width="1" />
            <use :href="`#suit-${suit}`" x="26" y="23" width="11" height="11" fill="currentColor" />
          </g>
          <text x="50" y="83" text-anchor="middle" class="face-letter" fill="currentColor">{{ label }}</text>
        </template>
      </svg>

      <svg class="side back" viewBox="0 0 100 140">
        <rect x="0.75" y="0.75" width="98.5" height="138.5" rx="7" fill="#fff" stroke="#8a8a8a" stroke-width="1.2" />
        <rect x="6" y="6" width="88" height="128" rx="4" :fill="`url(#back-${back})`" />
        <rect x="9" y="9" width="82" height="122" rx="3" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: absolute;
  left: 0;
  top: 0;
  perspective: 900px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform var(--flip-duration, 0.3s) ease var(--flip-delay, 0s);
  border-radius: 7%;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.35);
}
.inner.down {
  transform: rotateY(180deg);
}
.side {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.back {
  transform: rotateY(180deg);
}
.rank {
  font: 700 17px Georgia, 'Times New Roman', serif;
}
.rank.ten {
  font-size: 15px;
  letter-spacing: -1.5px;
}
.rank.big {
  font-size: 30px;
}
.rank.big.ten {
  font-size: 26px;
  letter-spacing: -3px;
}
.face-letter {
  font: 700 34px Georgia, 'Times New Roman', serif;
}
.selected .inner {
  filter: brightness(0.78) sepia(0.4) hue-rotate(170deg) saturate(2.2);
}
.hinted .inner {
  box-shadow: 0 0 0 3px #ffe14d, 0 0 12px 4px rgba(255, 225, 77, 0.85);
}
</style>
