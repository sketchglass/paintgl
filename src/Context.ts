
interface ContextOptions {
  preserveDrawingBuffer?: boolean
  alpha?: boolean
  antialias?: boolean
}

export
class Context {
  gl: WebGLRenderingContext
  halfFloatExt: any

  constructor(public canvas: HTMLCanvasElement, opts?: ContextOptions) {
    const glOpts = {
      preserveDrawingBuffer: false,
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    }
    if (opts) {
      for (const key in opts) {
        glOpts[key] = opts[key]
      }
    }
    const gl = this.gl = canvas.getContext("webgl", glOpts)! as WebGLRenderingContext
    this.halfFloatExt = gl.getExtension("OES_texture_half_float")
    gl.getExtension("OES_texture_half_float_linear")
    gl.getExtension("OES_texture_float")
  }
}
