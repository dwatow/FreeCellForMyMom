import { markRaw, shallowRef } from 'vue'

/** 目前開啟的對話框；同一時間只有一個，與 Win7 的模態視窗相同。 */
export const currentDialog = shallowRef(null)
let seq = 0

/**
 * 開啟對話框，回傳使用者關閉時的結果。
 * @param {object} component 會 emit('close', result) 的元件
 * @param {object} [props]
 * @returns {Promise<any>}
 */
export function openDialog(component, props = {}) {
  currentDialog.value?.resolve(null)
  return new Promise((resolve) => {
    currentDialog.value = { id: ++seq, component: markRaw(component), props, resolve }
  })
}

export function closeDialog(result = null) {
  const dialog = currentDialog.value
  currentDialog.value = null
  dialog?.resolve(result)
}
