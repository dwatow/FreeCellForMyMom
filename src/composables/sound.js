/** 用 Web Audio 合成音效，不需要音檔。 */
let ctx = null
let enabled = true

function audio() {
  if (!enabled || typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, duration, { type = 'sine', gain = 0.08, delay = 0 } = {}) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration)
}

function click(delay = 0) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const buffer = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const src = ac.createBufferSource()
  const filter = ac.createBiquadFilter()
  const g = ac.createGain()
  filter.type = 'bandpass'
  filter.frequency.value = 2400
  g.gain.value = 0.5
  src.buffer = buffer
  src.connect(filter).connect(g).connect(ac.destination)
  src.start(t)
}

export const sound = {
  setEnabled(value) {
    enabled = value
  },
  move: () => click(),
  invalid: () => tone(160, 0.18, { type: 'square', gain: 0.04 }),
  deal() {
    for (let i = 0; i < 12; i++) click(i * 0.11)
  },
  win() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, { type: 'triangle', delay: i * 0.13 }))
  },
}
