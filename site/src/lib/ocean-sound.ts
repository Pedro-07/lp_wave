// Som do mar sintetizado com Web Audio — sem arquivo de áudio.
// Camadas: grave (ruído marrom em passa-baixa) + espuma (ruído branco
// filtrado), ambas "respirando" com LFOs lentos, e um estouro de quebra
// disparado quando a onda atinge o ápice no scroll. O navegador só libera
// áudio após um gesto do usuário, então start() deve ser chamado num clique.

// Sincronizado com o roteiro do hero (SPEC §4): a onda cresce até 0.5,
// quando a tela começa a escurecer — é aí que ela "quebra".
const CRASH_AT = 0.5
const REARM_BELOW = 0.35
const MASTER_ON = 0.8

function noiseBuffer(ctx: BaseAudioContext, seconds: number, brown: boolean) {
  const buf = ctx.createBuffer(2, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      if (brown) {
        last = (last + 0.02 * white) / 1.02
        data[i] = last * 3.5
      } else {
        data[i] = white * 0.5
      }
    }
  }
  return buf
}

/** Intensidade do mar ao longo do hero (0–1): cresce até a quebra, assenta no símbolo. */
function intensityAt(p: number) {
  if (p < 0.5) return 0.35 + 0.65 * (p / 0.5)
  if (p < 0.9) return 1 - 0.7 * ((p - 0.5) / 0.4)
  return 0.3
}

export class OceanSound {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private rumble!: GainNode
  private wash!: GainNode
  private washLP!: BiquadFilterNode
  private white!: AudioBuffer
  private brown!: AudioBuffer
  private armed = true
  private lastP = 0
  private inside = true
  on = false

  private build() {
    const ctx = new AudioContext()
    this.ctx = ctx
    this.white = noiseBuffer(ctx, 6, false)
    this.brown = noiseBuffer(ctx, 6, true)

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    comp.connect(ctx.destination)
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(comp)

    // Grave
    const brownSrc = ctx.createBufferSource()
    brownSrc.buffer = this.brown
    brownSrc.loop = true
    const rumbleLP = ctx.createBiquadFilter()
    rumbleLP.type = "lowpass"
    rumbleLP.frequency.value = 380
    rumbleLP.Q.value = 0.5
    this.rumble = ctx.createGain()
    this.rumble.gain.value = 0.3
    brownSrc.connect(rumbleLP).connect(this.rumble).connect(this.master)

    // Espuma
    const whiteSrc = ctx.createBufferSource()
    whiteSrc.buffer = this.white
    whiteSrc.loop = true
    const washHP = ctx.createBiquadFilter()
    washHP.type = "highpass"
    washHP.frequency.value = 900
    this.washLP = ctx.createBiquadFilter()
    this.washLP.type = "lowpass"
    this.washLP.frequency.value = 2500
    this.wash = ctx.createGain()
    this.wash.gain.value = 0.08
    whiteSrc.connect(washHP).connect(this.washLP).connect(this.wash).connect(this.master)

    // Respiração: LFOs lentos somados aos ganhos
    const lfo = (freq: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator()
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = depth
      osc.connect(g).connect(target)
      osc.start()
    }
    lfo(0.07, 0.12, this.rumble.gain)
    lfo(0.11, 0.05, this.wash.gain)

    brownSrc.start()
    whiteSrc.start(0, 2.3) // defasado para não correlacionar com o grave
  }

  get running() {
    return this.on && this.ctx?.state === "running"
  }

  /** Precisa ser chamado dentro de um gesto do usuário (clique/toque/tecla). */
  async start() {
    if (!this.ctx) this.build()
    const ctx = this.ctx!
    this.on = true
    await ctx.resume()
    if (!this.on) return
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setTargetAtTime(this.inside ? MASTER_ON : 0, ctx.currentTime, 0.3)
    this.update(this.lastP)
  }

  stop() {
    const ctx = this.ctx
    this.on = false
    if (!ctx) return
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
    window.setTimeout(() => {
      if (!this.on) ctx.suspend()
    }, 900)
  }

  /** p = progresso do hero (0–1). */
  update(p: number) {
    const prev = this.lastP
    this.lastP = p
    const ctx = this.ctx
    if (!ctx || !this.on) return
    const t = ctx.currentTime
    const i = intensityAt(p)
    this.rumble.gain.setTargetAtTime(0.15 + 0.5 * i, t, 0.25)
    this.wash.gain.setTargetAtTime(0.35 * i ** 1.5, t, 0.25)
    this.washLP.frequency.setTargetAtTime(2000 + 5000 * i, t, 0.3)

    if (p < REARM_BELOW) this.armed = true
    if (this.armed && prev < CRASH_AT && p >= CRASH_AT) {
      this.armed = false
      this.crash()
    }
  }

  /** Saiu/voltou para a área do hero. */
  setInside(inside: boolean) {
    this.inside = inside
    const ctx = this.ctx
    if (!ctx || !this.on) return
    this.master.gain.setTargetAtTime(inside ? MASTER_ON : 0, ctx.currentTime, inside ? 0.3 : 0.5)
  }

  private crash() {
    const ctx = this.ctx!
    const t = ctx.currentTime

    // Estouro da espuma
    const src = ctx.createBufferSource()
    src.buffer = this.white
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.setValueAtTime(600, t)
    lp.frequency.exponentialRampToValueAtTime(5000, t + 0.15)
    lp.frequency.exponentialRampToValueAtTime(900, t + 2.8)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.9, t + 0.1)
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.2)
    src.connect(lp).connect(g).connect(this.master)
    src.start(t, Math.random() * 2)
    src.stop(t + 3.4)

    // Impacto grave
    const low = ctx.createBufferSource()
    low.buffer = this.brown
    const lowLP = ctx.createBiquadFilter()
    lowLP.type = "lowpass"
    lowLP.frequency.value = 150
    const lg = ctx.createGain()
    lg.gain.setValueAtTime(0.0001, t)
    lg.gain.linearRampToValueAtTime(0.8, t + 0.08)
    lg.gain.exponentialRampToValueAtTime(0.001, t + 1.6)
    low.connect(lowLP).connect(lg).connect(this.master)
    low.start(t, Math.random() * 2)
    low.stop(t + 1.8)
  }

  dispose() {
    this.on = false
    this.ctx?.close()
    this.ctx = null
  }
}
