export
class Context {
  gl: WebGLRenderingContext
  halfFloatExt: any

  constructor(public canvas: HTMLCanvasElement) {
    const glOpts = {
      preserveDrawingBuffer: true,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
    }
    const gl = this.gl = canvas.getContext("webgl", glOpts)! as WebGLRenderingContext
    this.halfFloatExt = gl.getExtension("OES_texture_half_float")
    gl.getExtension("OES_texture_half_float_linear")
    gl.getExtension("OES_texture_float")
  }
}
