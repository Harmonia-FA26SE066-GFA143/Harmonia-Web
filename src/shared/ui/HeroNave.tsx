import { CaretRightFilled, PauseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { media, sizes, spacing } from '@/styles/tokens'

const posterSrc = '/media/church-light-poster.webp'

const vertex = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'

/**
 * A Romanesque nave, modelled as a signed distance field and ray-marched: barrel vault with transverse ribs, an arcade
 * on engaged columns, aisles, clerestory, pews and a plain altar. The end wall holds three lancets and a rose; their
 * light is projected onto every surface and through the air as shafts. No cross or figure, by the brand's rules.
 */
const fragment = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLight;

const float BAY = 3.2;
const float END = 24.0;
const vec3 SUN = vec3(0.0, -0.2873, -0.9578);

float box2(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float box3(vec3 p, vec3 b) { vec3 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0); }
float arch(vec2 p, float halfWidth, float spring) {
  return min(box2(p - vec2(0.0, spring * 0.5), vec2(halfWidth, spring * 0.5)), length(p - vec2(0.0, spring)) - halfWidth);
}

float map(vec3 p) {
  float zc = mod(p.z, BAY) - BAY * 0.5;
  float ax = abs(p.x);
  float nave = arch(p.xy, 2.7, 6.2);
  float bays = max(arch(vec2(zc, p.y), 1.2, 3.0), abs(ax - 3.2) - 0.7);
  float aisle = box2(vec2(ax - 4.6, p.y - 2.4), vec2(0.9, 2.4));
  float clerestory = max(arch(vec2(zc, p.y - 4.55), 0.42, 0.75), abs(ax - 3.0) - 0.5);
  float inside = max(min(min(nave, bays), min(aisle, clerestory)), p.z - END);
  float d = -inside;
  float seam = abs(abs(zc) - BAY * 0.5);
  d = min(d, max(length(vec2(ax - 2.7, seam)) - 0.34, p.y - 6.2));
  d = min(d, max(seam - 0.17, -arch(p.xy, 2.46, 6.2)));
  float zp = mod(p.z, 1.25) - 0.625;
  float rows = abs(p.z - 10.2) - 7.0;
  float pew = min(box3(vec3(ax - 1.55, p.y - 0.48, zp), vec3(0.95, 0.48, 0.06)), box3(vec3(ax - 1.55, p.y - 0.44, zp - 0.22), vec3(0.95, 0.04, 0.22)));
  d = min(d, max(pew, rows));
  d = min(d, box3(p - vec3(0.0, 0.14, END - 3.4), vec3(2.6, 0.14, 2.6)));
  d = min(d, box3(p - vec3(0.0, 0.76, END - 3.4), vec3(1.05, 0.5, 0.42)));
  return d;
}

float windows(vec2 q, float soft) {
  float mask = 0.0;
  for (int i = -1; i <= 1; i++) {
    float x = float(i) * 1.5;
    float foot = i == 0 ? 1.7 : 2.2;
    float tall = i == 0 ? 3.6 : 2.9;
    float d = arch(q - vec2(x, foot), 0.56, tall);
    float pane = smoothstep(soft, -soft, d);
    pane *= smoothstep(0.02, 0.05 + soft, abs(q.x - x));
    pane *= 0.82 + 0.18 * smoothstep(0.02, 0.05 + soft, abs(mod(q.y, 0.9) - 0.45));
    mask = max(mask, pane);
  }
  vec2 r = q - vec2(0.0, 7.05);
  float radius = length(r);
  float rose = smoothstep(soft, -soft, radius - 1.08);
  float spoke = abs(mod(atan(r.y, r.x), 0.7854) - 0.3927) * radius;
  rose *= smoothstep(0.02, 0.06 + soft, spoke) * smoothstep(0.02, 0.05 + soft, abs(radius - 0.42));
  return max(mask, rose);
}

float sunAt(vec3 p) {
  float s = (END - p.z) / -SUN.z;
  return windows((p - SUN * s).xy, 0.04 + s * 0.012);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.004;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;
  vec3 ro = vec3(sin(uTime * 0.07) * 0.3, 1.75 + sin(uTime * 0.05) * 0.06, 1.2 + sin(uTime * 0.045) * 0.9);
  vec3 forward = normalize(vec3(0.0, 6.3, END) - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 rd = normalize(uv.x * right + uv.y * cross(forward, right) + 1.7 * forward);

  float t = 0.05;
  for (int i = 0; i < 80; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0015 * t || t > 44.0) break;
    t += d * 0.85;
  }
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  vec3 gold = vec3(1.0, 0.8, 0.55);

  float ao = clamp(map(p + n * 0.35) / 0.35, 0.0, 1.0) * 0.6 + clamp(map(p + n * 1.1) / 1.1, 0.0, 1.0) * 0.4;
  float toEnd = exp(-(END - p.z) * 0.07);
  vec3 stone = vec3(0.62, 0.53, 0.47);
  if (p.y < 0.02) stone = mix(vec3(0.34, 0.22, 0.22), vec3(0.5, 0.42, 0.37), step(0.0, sin(p.x * 3.2) * sin(p.z * 3.2)));
  if (abs(p.x) < 2.6 && p.y < 1.0 && p.y > 0.02 && p.z < 18.0) stone = vec3(0.3, 0.16, 0.12);

  vec3 color = stone * vec3(0.3, 0.16, 0.18) * ao;
  color += stone * gold * sunAt(p) * max(dot(n, -SUN), 0.0) * 2.6 * uLight;
  color += stone * gold * toEnd * (0.5 + 0.5 * max(n.z * -1.0, 0.0) + 0.3 * max(n.y, 0.0)) * ao * 1.5 * uLight;

  if (p.z > END - 0.03) color += mix(vec3(0.0), vec3(1.5, 1.28, 0.95) * 2.6, windows(p.xy, 0.02)) * uLight;
  if (abs(p.x) > 3.4 && abs(p.x) < 3.56 && p.y > 4.5 && p.y < 5.8) color += gold * 0.55 * uLight;

  float jitter = hash(gl_FragCoord.xy + fract(uTime));
  float air = 0.0;
  float span = min(t, 30.0);
  for (int i = 0; i < 22; i++) {
    vec3 q = ro + rd * span * (float(i) + jitter) / 22.0;
    float dust = 0.75 + 0.25 * sin(q.x * 2.1 + uTime * 0.2) * sin(q.y * 1.7 - uTime * 0.13 + q.z * 0.6);
    air += sunAt(q) * dust;
  }
  color += gold * air / 22.0 * span * 0.17 * uLight;

  color = 1.0 - exp(-color * 1.25);
  color = pow(color, vec3(0.82));
  color *= 1.0 - 0.3 * dot(uv * vec2(0.42, 0.7), uv * vec2(0.42, 0.7));
  gl_FragColor = vec4(color, 1.0);
}`

const cover = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '70% center' } as const

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram()
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

interface HeroNaveProps {
  /** A second canvas that shows the same scene, unscrimmed, where it lies over the hero. */
  aperture?: RefObject<HTMLCanvasElement | null>
  onUnavailable?: () => void
  /** One frame with the light on and no controls: for pages where someone is filling in a form. */
  still?: boolean
}

/**
 * Background of the landing hero: the drawn nave in WebGL, with no library and no video. The light comes up once, then
 * the camera drifts. Reduced motion gets one still frame with the light on; without WebGL, the photograph.
 */
export function HeroNave({ aperture, onUnavailable, still = false }: Readonly<HeroNaveProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersStill = useReducedMotion()
  const reduced = prefersStill || still
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(true)
  const playingRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const unavailable = () => {
      setFailed(true)
      onUnavailable?.()
    }
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
    const program = gl && createProgram(gl)
    if (!gl || !program) {
      unavailable()
      return
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uLight = gl.getUniformLocation(program, 'uLight')

    // ponytail: rendered below screen size and capped at 30 fps; the scene is soft enough not to show it.
    let scale = 0.62
    let time = 0
    let visible = true

    const draw = () => {
      const rise = reduced ? 1 : Math.min(time / 2.2, 1)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, time)
      gl.uniform1f(uLight, 1 - (1 - rise) ** 3)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Copied in the same task as the draw, while the drawing buffer is still valid.
      const target = aperture?.current
      const context = target?.getContext('2d')
      if (!target || !context) return
      const from = canvas.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      if (!from.width || !to.width) return
      const ratio = canvas.width / from.width
      if (target.width !== Math.round(to.width * ratio)) target.width = Math.round(to.width * ratio)
      if (target.height !== Math.round(to.height * ratio)) target.height = Math.round(to.height * ratio)
      context.drawImage(canvas, (to.left - from.left) * ratio, (to.top - from.top) * ratio, to.width * ratio, to.height * ratio, 0, 0, target.width, target.height)
    }

    const fit = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale))
      draw()
    }
    fit()
    const sized = new ResizeObserver(fit)
    sized.observe(canvas)
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    seen.observe(canvas)
    canvas.addEventListener('webglcontextlost', unavailable)

    let frame = 0
    let last = 0
    let slow = 0
    let frames = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const elapsed = now - last
      if (elapsed < 33) return
      last = now
      if (!playingRef.current || !visible || document.hidden || elapsed > 1000) return
      time += elapsed / 1000
      draw()
      // A weak GPU first gets fewer pixels, then a still picture.
      frames += 1
      slow += elapsed > 80 ? 1 : 0
      if (frames < 20) return
      if (slow > 12) {
        if (scale > 0.4) {
          scale = 0.4
          fit()
        } else {
          time = Math.max(time, 2.2)
          draw()
          cancelAnimationFrame(frame)
          playingRef.current = false
          setPlaying(false)
        }
      }
      frames = 0
      slow = 0
    }
    if (!reduced) frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      sized.disconnect()
      seen.disconnect()
      canvas.removeEventListener('webglcontextlost', unavailable)
    }
  }, [aperture, onUnavailable, reduced])

  if (failed) return <img src={posterSrc} alt="" aria-hidden style={cover} />

  const toggle = () => {
    playingRef.current = !playingRef.current
    setPlaying(playingRef.current)
  }

  return (
    <>
      <canvas ref={canvasRef} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {!reduced && (
        <Button
          shape="circle"
          icon={playing ? <PauseOutlined /> : <CaretRightFilled />}
          aria-label={playing ? 'Tạm dừng hình nền' : 'Phát hình nền'}
          onClick={toggle}
          style={{
            position: 'absolute',
            insetInlineEnd: spacing.md,
            insetBlockEnd: spacing.md,
            // Above the hero's stage, which spans the full width.
            zIndex: 3,
            width: sizes.touchTarget,
            height: sizes.touchTarget,
            color: media.text,
            background: media.controlGround,
            borderColor: media.controlBorder,
          }}
        />
      )}
    </>
  )
}
