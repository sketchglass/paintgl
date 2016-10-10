import {Shader} from "./Shader"

export
interface ContextOptions {
  preserveDrawingBuffer?: boolean
  alpha?: boolean
  antialias?: boolean
}

export
interface ContextCapabilities {
  /**
    Whether the context support half float pixmaps.
  */
  halfFloat: boolean
  /**
    Whether the context support linear filtering of half float pixmaps.
  */
  halfFloatLinearFilter: boolean
  /**
    Whether the context support float pixmaps.
  */
  float: boolean
  /**
    Whether the context support linear filtering of float pixmaps.
  */
  floatLinearFilter: boolean
}

/**
  Context contains the WebGL context.
*/
export
class Context {
  /**
    The WebGL rendering context used in this Context.
  */
  gl: WebGLRenderingContext

  halfFloatExt: any

  /**
    The capabilities supported by current browser.
  */
  capabilities: ContextCapabilities

  private _shaders = new WeakMap<typeof Shader, Shader>()

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
    this.capabilities = {
      halfFloat: !!this.halfFloatExt,
      halfFloatLinearFilter:  !!gl.getExtension("OES_texture_half_float_linear"),
      float: !!gl.getExtension("OES_texture_float"),
      floatLinearFilter: !!gl.getExtension("OES_texture_float_linear"),
    }
  }

  getOrCreateShader(klass: typeof Shader) {
    let shader = this._shaders.get(klass)
    if (shader) {
      return shader
    } else {
      shader = new klass(this)
      this._shaders.set(klass, shader)
      return shader
    }
  }
}
