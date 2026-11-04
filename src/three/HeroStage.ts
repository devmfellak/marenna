import {
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  VideoTexture,
  WebGLRenderer,
} from 'three'

export type StageSlide = { video: string; poster: string }

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// A tide line sweeps across the frame. The outgoing film refracts as it passes, and a band of
// foam marks the edge between the two scenes.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uRes;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform vec2 uPointer;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }
  vec2 cover(vec2 uv, vec2 size) {
    float rs = uRes.x / uRes.y, ri = size.x / size.y;
    vec2 scale = rs < ri ? vec2(ri / rs, 1.0) : vec2(1.0, rs / ri);
    return (uv - 0.5) / scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    float n = fbm(vec2(uv.x * aspect, uv.y) * 2.6 + vec2(0.0, uTime * 0.12));

    // Front runs from the right edge to the left, with a noisy shoreline.
    float front = (1.0 - uv.x) * 0.9 + uv.y * 0.1 + (n - 0.5) * 0.42;
    const float soft = 0.16;
    float p = uProgress * (1.3 + soft * 2.0) - soft - 0.15;
    float mask = smoothstep(p - soft, p + soft, front);
    float band = 1.0 - abs(mask * 2.0 - 1.0);

    vec2 ripple = vec2(
      sin(front * 46.0 - uTime * 4.0) * 0.012 + (n - 0.5) * 0.09,
      cos(front * 34.0 + uTime * 3.0) * 0.008
    ) * band;
    vec2 drift = (uPointer - 0.5) * 0.012;

    vec2 fromUv = cover(uv + ripple + drift, uFromSize);
    vec2 toUv = cover(uv - ripple * 0.7 + drift, uToSize);
    // Zoom gives the incoming scene a little push as the tide reaches it.
    toUv = (toUv - 0.5) * (1.0 + mask * 0.06) + 0.5;

    vec3 color = mix(texture2D(uTo, toUv).rgb, texture2D(uFrom, fromUv).rgb, mask);
    float foam = pow(band, 7.0) * smoothstep(0.42, 0.72, fbm(uv * 26.0 + uTime * 0.6));
    color += foam * 0.55;
    gl_FragColor = vec4(color, 1.0);
  }
`

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const DURATION = 1700

type Runtime = {
  el: HTMLVideoElement | null
  videoTexture: VideoTexture | null
  poster: Texture | null
  posterSize: Vector2
  posterLoading: Promise<void> | null
}

export class HeroStage {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: ShaderMaterial
  private loader = new TextureLoader()
  private runtime: Runtime[]
  private current: number
  private target: number | null = null
  private startedAt = 0
  private raf = 0
  private running = false
  private pointer = new Vector2(0.5, 0.5)
  private pointerSmooth = new Vector2(0.5, 0.5)
  private blank = new Texture()
  private clockStart = performance.now()
  private observer: ResizeObserver
  private disposed = false

  constructor(
    private canvas: HTMLCanvasElement,
    private slides: StageSlide[],
    start: number,
    private onFirstFrame: () => void,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
    // Sources are already display-referred, so colour passes straight through.
    this.renderer.outputColorSpace = LinearSRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uFrom: { value: this.blank },
        uTo: { value: this.blank },
        uRes: { value: new Vector2(1, 1) },
        uFromSize: { value: new Vector2(16, 9) },
        uToSize: { value: new Vector2(16, 9) },
        uPointer: { value: this.pointerSmooth },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
    })
    this.scene.add(new Mesh(new PlaneGeometry(2, 2), this.material))

    this.runtime = slides.map(() => ({
      el: null,
      videoTexture: null,
      poster: null,
      posterSize: new Vector2(16, 9),
      posterLoading: null,
    }))
    this.current = start

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()

    void this.loadPoster(start).then(() => {
      if (this.disposed) return
      this.startVideo(start)
      this.primeVideo(this.nextIndex(start))
      this.render(performance.now())
      this.onFirstFrame()
      this.setRunning(true)
    })
  }

  private nextIndex(i: number) {
    return (i + 1) % this.slides.length
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.material.uniforms.uRes.value.set(w, h)
  }

  private loadPoster(i: number) {
    const rt = this.runtime[i]
    if (rt.posterLoading) return rt.posterLoading
    rt.posterLoading = new Promise<void>((resolve) => {
      this.loader.load(
        this.slides[i].poster,
        (tex) => {
          tex.colorSpace = NoColorSpace
          tex.minFilter = LinearFilter
          tex.magFilter = LinearFilter
          tex.generateMipmaps = false
          const img = tex.image as HTMLImageElement
          rt.posterSize.set(img.width, img.height)
          rt.poster = tex
          resolve()
        },
        undefined,
        () => resolve(),
      )
    })
    return rt.posterLoading
  }

  private primeVideo(i: number) {
    const rt = this.runtime[i]
    void this.loadPoster(i)
    if (rt.el) return rt.el
    const el = document.createElement('video')
    el.muted = true
    el.loop = true
    el.playsInline = true
    el.preload = 'auto'
    el.setAttribute('aria-hidden', 'true')
    el.src = this.slides[i].video
    rt.el = el
    rt.videoTexture = new VideoTexture(el)
    rt.videoTexture.colorSpace = NoColorSpace
    rt.videoTexture.minFilter = LinearFilter
    rt.videoTexture.magFilter = LinearFilter
    rt.videoTexture.generateMipmaps = false
    el.load()
    return el
  }

  private startVideo(i: number) {
    const el = this.primeVideo(i)
    // Autoplay can be refused by the browser. The poster stays on screen when it is.
    el.play().catch(() => {})
  }

  /** The playing video once it has frames, otherwise the poster. */
  private source(i: number): { tex: Texture; w: number; h: number } {
    const rt = this.runtime[i]
    if (rt.el && rt.videoTexture && rt.el.readyState >= 2 && rt.el.videoWidth) {
      return { tex: rt.videoTexture, w: rt.el.videoWidth, h: rt.el.videoHeight }
    }
    if (rt.poster) return { tex: rt.poster, w: rt.posterSize.x, h: rt.posterSize.y }
    return { tex: this.blank, w: 16, h: 9 }
  }

  goTo(i: number) {
    if (this.disposed || i === (this.target ?? this.current)) return
    if (this.target !== null) {
      this.pauseVideo(this.current)
      this.current = this.target
    }
    this.target = i
    this.startedAt = -1
    this.startVideo(i)
    void this.loadPoster(i).then(() => {
      if (this.target === i && this.startedAt === -1) this.startedAt = performance.now()
    })
    this.primeVideo(this.nextIndex(i))
  }

  private pauseVideo(i: number) {
    this.runtime[i].el?.pause()
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, 1 - y)
  }

  setRunning(on: boolean) {
    if (this.disposed || on === this.running) return
    this.running = on
    const active = this.runtime[this.target ?? this.current]
    if (on) {
      active.el?.play().catch(() => {})
      this.raf = requestAnimationFrame(this.tick)
    } else {
      cancelAnimationFrame(this.raf)
      this.runtime.forEach((rt) => rt.el?.pause())
    }
  }

  private tick = (now: number) => {
    if (!this.running) return
    this.render(now)
    this.raf = requestAnimationFrame(this.tick)
  }

  private render(now: number) {
    const u = this.material.uniforms
    this.pointerSmooth.lerp(this.pointer, 0.04)
    u.uTime.value = (now - this.clockStart) / 1000

    let progress = 0
    if (this.target !== null && this.startedAt > 0) {
      progress = Math.min((now - this.startedAt) / DURATION, 1)
      if (progress === 1) {
        this.pauseVideo(this.current)
        this.current = this.target
        this.target = null
        progress = 0
      }
    }

    const from = this.source(this.current)
    u.uFrom.value = from.tex
    u.uFromSize.value.set(from.w, from.h)
    if (this.target !== null) {
      const to = this.source(this.target)
      u.uTo.value = to.tex
      u.uToSize.value.set(to.w, to.h)
    } else {
      u.uTo.value = from.tex
      u.uToSize.value.set(from.w, from.h)
    }
    u.uProgress.value = ease(progress)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.setRunning(false)
    this.observer.disconnect()
    for (const rt of this.runtime) {
      if (rt.el) {
        rt.el.pause()
        rt.el.removeAttribute('src')
        rt.el.load()
      }
      rt.videoTexture?.dispose()
      rt.poster?.dispose()
    }
    this.material.dispose()
    this.renderer.dispose()
  }
}
