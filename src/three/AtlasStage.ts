import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

export type AtlasPin = { lat: number; lon: number }

const latLon = (lat: number, lon: number, radius = 1) => {
  const phi = MathUtils.degToRad(90 - lat)
  const theta = MathUtils.degToRad(lon + 180)
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const earthFragment = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uWater;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(cameraPosition - vWorld);
    float sun = dot(n, uSun);
    float day = smoothstep(-0.12, 0.28, sun);

    vec3 dayColor = texture2D(uDay, vUv).rgb * (0.32 + max(sun, 0.0) * 1.05);
    vec3 nightColor = texture2D(uNight, vUv).rgb * vec3(1.5, 1.28, 0.9);
    vec3 color = mix(nightColor + vec3(0.004, 0.008, 0.018), dayColor, day);

    float water = texture2D(uWater, vUv).r;
    vec3 h = normalize(uSun + v);
    color += pow(max(dot(n, h), 0.0), 220.0) * water * day * vec3(0.8, 0.86, 0.95) * 0.12;

    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.2);
    color += rim * vec3(0.3, 0.55, 1.0) * mix(0.12, 0.85, day);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

const haloVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const haloFragment = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(cameraPosition - vWorld);
    float glow = pow(clamp(dot(-n, v) * 1.05, 0.0, 1.0), 3.4);
    float lit = 0.3 + 0.7 * smoothstep(-0.5, 0.5, dot(-n, uSun));
    gl_FragColor = vec4(vec3(0.32, 0.58, 1.0) * glow * lit * 1.6, glow);
  }
`

/** A raised great-circle path between two points on the unit sphere. */
function arcGeometry(a: Vector3, b: Vector3) {
  const points: Vector3[] = []
  const angle = a.angleTo(b)
  // Kept low so long routes hug the globe instead of looping out past its edge.
  const lift = 0.012 + angle * 0.035
  for (let i = 0; i <= 48; i++) {
    const t = i / 48
    const s = Math.sin(angle)
    const p =
      s < 1e-4
        ? a.clone()
        : a
            .clone()
            .multiplyScalar(Math.sin((1 - t) * angle) / s)
            .add(b.clone().multiplyScalar(Math.sin(t * angle) / s))
    points.push(p.normalize().multiplyScalar(1 + Math.sin(t * Math.PI) * lift))
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 120, 0.0035, 6, false)
}

const ARC_INDEX_COUNT = 120 * 6 * 6

export class AtlasStage {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(32, 1, 0.1, 40)
  private pitchGroup = new Group()
  private yawGroup = new Group()
  private earthMaterial: ShaderMaterial
  private haloMaterial: ShaderMaterial
  private pinPositions: Vector3[]
  private arc: Mesh<TubeGeometry, MeshBasicMaterial> | null = null
  private arcStart = 0
  private raf = 0
  private running = false
  private yaw = 0
  private pitch = 0.3
  private targetYaw = 0
  private targetPitch = 0.3
  private velocity = 0
  private dragging = false
  private lastX = 0
  private lastY = 0
  private autoSpin = true
  private idleUntil = 0
  private observer: ResizeObserver
  private selected = -1
  private textures: Texture[] = []
  private width = 1
  private height = 1
  private projected = new Vector3()
  private world = new Vector3()
  private toCamera = new Vector3()
  private outward = new Vector3()
  private disposed = false

  constructor(
    private canvas: HTMLCanvasElement,
    pins: AtlasPin[],
    private pinEls: () => (HTMLElement | null)[],
    private onReady: () => void,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.camera.position.set(0, 0, 4.15)

    this.pinPositions = pins.map((p) => latLon(p.lat, p.lon))

    // Almost behind the camera, so the place in focus is always in daylight and dusk stays at the edge.
    const sun = new Vector3(-0.5, 0.35, 0.8).normalize()
    this.earthMaterial = new ShaderMaterial({
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
      uniforms: {
        uDay: { value: null },
        uNight: { value: null },
        uWater: { value: null },
        uSun: { value: sun },
      },
    })
    this.haloMaterial = new ShaderMaterial({
      vertexShader: haloVertex,
      fragmentShader: haloFragment,
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      uniforms: { uSun: { value: sun } },
    })

    const earth = new Mesh(new SphereGeometry(1, 96, 64), this.earthMaterial)
    this.yawGroup.add(earth)
    this.pitchGroup.add(this.yawGroup)
    this.scene.add(this.pitchGroup)
    this.scene.add(new Mesh(new SphereGeometry(1.2, 64, 48), this.haloMaterial))
    this.scene.add(this.makeStars())

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()

    canvas.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('pointercancel', this.onUp)

    void this.loadTextures()
  }

  private async loadTextures() {
    const loader = new TextureLoader()
    const load = (url: string, srgb: boolean) =>
      new Promise<Texture>((resolve, reject) => {
        loader.load(
          url,
          (t) => {
            if (srgb) t.colorSpace = SRGBColorSpace
            t.anisotropy = 4
            this.textures.push(t)
            resolve(t)
          },
          undefined,
          reject,
        )
      })
    const [day, night, water] = await Promise.all([
      load('/media/earth/earth-blue-marble.webp', true),
      load('/media/earth/earth-night.webp', true),
      load('/media/earth/earth-water.webp', false),
    ])
    if (this.disposed) return
    this.earthMaterial.uniforms.uDay.value = day
    this.earthMaterial.uniforms.uNight.value = night
    this.earthMaterial.uniforms.uWater.value = water
    this.onReady()
    this.renderFrame(performance.now())
  }

  private makeStars() {
    const count = 900
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const v = new Vector3().randomDirection().multiplyScalar(9 + Math.random() * 8)
      v.z = Math.min(v.z, -1.5)
      positions.set([v.x, v.y, v.z], i * 3)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return new Points(
      geometry,
      new PointsMaterial({ color: 0xbfd2ff, size: 0.032, transparent: true, opacity: 0.75, depthWrite: false }),
    )
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    if (!w || !h) return
    this.width = w
    this.height = h
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // Keep the whole globe in frame on tall, narrow canvases.
    this.camera.position.z = w / h < 1 ? 4.15 / Math.max(w / h, 0.62) : 4.15
    this.camera.updateProjectionMatrix()
    if (!this.running) this.renderFrame(performance.now())
  }

  private onDown = (e: PointerEvent) => {
    this.dragging = true
    this.autoSpin = false
    this.lastX = e.clientX
    this.lastY = e.clientY
    this.velocity = 0
    this.canvas.style.cursor = 'grabbing'
  }

  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return
    const dx = e.clientX - this.lastX
    const dy = e.clientY - this.lastY
    this.lastX = e.clientX
    this.lastY = e.clientY
    const speed = 3.2 / Math.max(this.width, 300)
    this.targetYaw += dx * speed
    this.velocity = dx * speed
    // Touch keeps vertical movement for page scrolling.
    if (e.pointerType !== 'touch') {
      this.targetPitch = MathUtils.clamp(this.targetPitch + dy * speed, -1.1, 1.1)
    }
  }

  private onUp = () => {
    if (!this.dragging) return
    this.dragging = false
    this.idleUntil = performance.now() + 6000
    this.canvas.style.cursor = 'grab'
  }

  /** Spin to a pin and draw a flight path from the previous one. */
  focus(i: number, animateArc = true) {
    const pin = this.pinPositions[i]
    if (!pin) return
    const lat = Math.asin(pin.y)
    const lon = Math.atan2(-pin.z, pin.x)
    let yaw = -Math.PI / 2 - lon
    // Take the short way round.
    yaw += Math.round((this.targetYaw - yaw) / (Math.PI * 2)) * Math.PI * 2
    this.targetYaw = yaw
    this.targetPitch = MathUtils.clamp(lat * 0.85, -1.1, 1.1)
    this.velocity = 0
    this.autoSpin = false
    this.idleUntil = Infinity

    if (animateArc && this.selected >= 0 && this.selected !== i) this.drawArc(this.pinPositions[this.selected], pin)
    this.selected = i
    if (!this.running) this.renderFrame(performance.now())
  }

  private drawArc(a: Vector3, b: Vector3) {
    if (this.arc) {
      this.yawGroup.remove(this.arc)
      this.arc.geometry.dispose()
      this.arc.material.dispose()
    }
    this.arc = new Mesh(arcGeometry(a, b), new MeshBasicMaterial({ color: 0xf1dc4a, transparent: true, opacity: 0.95 }))
    this.arc.geometry.setDrawRange(0, 0)
    this.yawGroup.add(this.arc)
    this.arcStart = performance.now()
  }

  setRunning(on: boolean) {
    if (this.disposed || on === this.running) return
    this.running = on
    if (on) this.raf = requestAnimationFrame(this.tick)
    else cancelAnimationFrame(this.raf)
  }

  private tick = (now: number) => {
    if (!this.running) return
    this.renderFrame(now)
    this.raf = requestAnimationFrame(this.tick)
  }

  private renderFrame(now: number) {
    if (this.autoSpin || now > this.idleUntil) {
      this.autoSpin = true
      this.targetYaw += 0.0012
    }
    if (!this.dragging && Math.abs(this.velocity) > 1e-4) {
      this.targetYaw += this.velocity
      this.velocity *= 0.94
    }
    this.yaw += (this.targetYaw - this.yaw) * 0.075
    this.pitch += (this.targetPitch - this.pitch) * 0.075
    this.yawGroup.rotation.y = this.yaw
    this.pitchGroup.rotation.x = this.pitch

    if (this.arc) {
      const t = Math.min((now - this.arcStart) / 1400, 1)
      this.arc.geometry.setDrawRange(0, Math.floor((1 - Math.pow(1 - t, 3)) * ARC_INDEX_COUNT))
    }

    this.renderer.render(this.scene, this.camera)
    this.placePins()
  }

  private placePins() {
    this.scene.updateMatrixWorld()
    const els = this.pinEls()
    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      if (!el) continue
      this.world.copy(this.pinPositions[i]).applyMatrix4(this.yawGroup.matrixWorld)
      // Fade pins as they go over the horizon.
      this.toCamera.copy(this.camera.position).sub(this.world).normalize()
      const facing = this.outward.copy(this.world).normalize().dot(this.toCamera)
      const visible = facing > 0.12
      this.projected.copy(this.world).project(this.camera)
      const x = (this.projected.x * 0.5 + 0.5) * this.width
      const y = (-this.projected.y * 0.5 + 0.5) * this.height
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.opacity = visible ? String(Math.min((facing - 0.12) * 5, 1)) : '0'
      el.style.visibility = visible ? 'visible' : 'hidden'
    }
  }

  dispose() {
    this.disposed = true
    this.setRunning(false)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('pointercancel', this.onUp)
    this.textures.forEach((t) => t.dispose())
    this.scene.traverse((o) => {
      if (o instanceof Mesh || o instanceof Points) {
        o.geometry.dispose()
        ;(o.material as ShaderMaterial).dispose()
      }
    })
    this.renderer.dispose()
  }
}

export const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
