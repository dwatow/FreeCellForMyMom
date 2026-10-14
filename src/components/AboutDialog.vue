<script setup>
import BaseDialog from './BaseDialog.vue'

const emit = defineEmits(['close'])
</script>

<template>
  <BaseDialog title="關於新接龍" width="480px" @close="emit('close', $event)">
    <h3 class="heading">怎麼玩</h3>
    <ul class="rules">
      <li>目標：把 52 張牌依花色從 A 到 K 收到右上角的 4 個回收區。</li>
      <li>下方各欄的牌可以疊在點數大一、顏色不同的牌上，例如紅心 9 疊在黑桃 10 上。</li>
      <li>左上角的 4 個暫存格各可以暫放一張牌；空欄可以放任何牌。</li>
      <li>一次可以移動多張連續的牌，張數上限取決於空的暫存格和空欄數量。</li>
      <li>拖曳移牌，或先點一下牌再點目的地；雙擊可以把牌收到回收區或放到暫存格。</li>
    </ul>
    <h3 class="heading">快速鍵</h3>
    <p class="keys">F2 新局　F3 選擇遊戲　F4 統計資料　F5 選項　F7 變更外觀　Ctrl+Z 復原　H 提示</p>
    <h3 class="heading">牌局編號</h3>
    <p>
      發牌採用與 Microsoft 新接龍相同的演算法，同一個局號會得到與 Windows 相同的牌局。在網址加上
      <code>?game=局號</code> 就能直接開啟或分享指定的牌局。
    </p>
    <template #footer>
      <button class="btn primary" @click="emit('close', null)">確定</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.heading {
  font-size: 14px;
  font-weight: normal;
  color: #1e3287;
  margin: 0 0 6px;
}
.rules {
  margin: 0 0 14px;
  padding-left: 20px;
  line-height: 1.6;
}
.keys {
  margin: 0 0 14px;
}
p {
  line-height: 1.6;
  margin: 0;
}
</style>
