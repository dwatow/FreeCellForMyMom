import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../src/App.vue'
import { SAVE_KEY } from '../src/stores/game.js'

beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '/?game=617')
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  globalThis.requestAnimationFrame ??= (cb) => setTimeout(cb, 0)
})
afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('依網址的局號開局，並顯示選單與狀態列', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('.status').text()).toContain('第 617 局')
    expect(wrapper.findAll('[data-card]')).toHaveLength(52)
    expect(wrapper.text()).toContain('遊戲')
    expect(document.title).toBe('新接龍 #617')
    wrapper.unmount()
  })

  it('有存檔時詢問是否繼續', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ gameNumber: 5, moves: [], elapsed: 0 }))
    const wrapper = mount(App, { global: { plugins: [createPinia()] }, attachTo: document.body })
    await flushPromises()
    expect(document.body.textContent).toContain('第 5 局')
    expect(document.body.querySelector('[role=dialog]')).not.toBeNull()
    wrapper.unmount()
  })
})
