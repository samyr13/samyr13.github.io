import { useEffect, useRef } from 'react'
import { pointer, reducedMotion } from '../lib/runtime'

/**
 * Fond WebGL du hero : fumée chaude + horizon orange, réagit doucement à la souris.
 * Rendu en demi-résolution, adapte sa résolution si les FPS chutent, pause hors écran / onglet caché.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;vec2 q=(gl_FragCoord.xy-.5*r)/r.y;
  float T=t*.045;
  vec2 w=vec2(fbm(q*1.6+vec2(T,-T*.6)),fbm(q*1.6+vec2(-T*.7,T)+3.1));
  float s=fbm(q*2.2+w*1.4+vec2(0.,-T*1.6));
  float horizon=smoothstep(.62,0.,uv.y);
  float glow=pow(s,2.2)*(.35+horizon*1.15);
  vec2 mp=(m-.5*r)/r.y;float md=length(q-mp);
  glow+=.10*exp(-md*md*7.)*s;
  float vign=smoothstep(1.05,.15,length(q*vec2(.9,1.15)));
  vec3 ember=vec3(1.,.45,.17);vec3 deep=vec3(.55,.13,.04);
  vec3 col=vec3(.039,.031,.027)+mix(deep,ember,s)*glow*.32*vign*vign;
  col+=vec3(1.,.5,.2)*horizon*horizon*.035;
  gl_FragColor=vec4(col,1.);
}`

export function EmberField({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false })
    if (!gl) return
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    const vs = sh(gl.VERTEX_SHADER, VERT)
    const fs = sh(gl.FRAGMENT_SHADER, FRAG)
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uR = gl.getUniformLocation(prog, 'r')
    const uT = gl.getUniformLocation(prog, 't')
    const uM = gl.getUniformLocation(prog, 'm')

    let scale = 0.5 // demi-résolution : la fumée est floue par nature
    let w = 0, h = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width * scale))
      h = Math.max(1, Math.round(rect.height * scale))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uR, w, h)
    }
    resize()

    let raf = 0
    let visible = true
    let mx = w * 0.5, my = h * 0.3
    let last = performance.now()
    let slow = 0
    const t0 = performance.now()
    const frame = (now: number) => {
      const dt = now - last
      last = now
      // résolution adaptative : si on passe sous ~45 fps, on baisse
      if (dt > 22) slow++
      else slow = Math.max(0, slow - 1)
      if (slow > 40 && scale > 0.3) { scale = 0.33; slow = 0; resize() }
      const rect = canvas.getBoundingClientRect()
      mx += ((pointer.x - rect.left) * scale - mx) * 0.05
      my += ((rect.height - (pointer.y - rect.top)) * scale - my) * 0.05
      gl.uniform1f(uT, (now - t0) / 1000)
      gl.uniform2f(uM, mx, my)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (visible && !reducedMotion) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && document.visibilityState === 'visible'
      if (visible) start()
      else cancelAnimationFrame(raf)
    })
    io.observe(canvas)
    const onVis = () => {
      visible = document.visibilityState === 'visible' && canvas.getBoundingClientRect().bottom > 0
      if (visible) start()
      else cancelAnimationFrame(raf)
    }
    document.addEventListener('visibilitychange', onVis)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    start()

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // pas de loseContext() : le canvas peut être ré-utilisé (StrictMode / HMR)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={`h-full w-full ${className}`} />
}
