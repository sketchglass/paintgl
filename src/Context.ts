import {Texture} from "./Texture"
import {Shader} from "./Shader"
import {Program} from "./Program"
import {CanvasDrawTarget} from "./DrawTarget"

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

  vertexArrayExt: any

  /**
    The capabilities supported by current browser.
  */
  capabilities: ContextCapabilities

  textureUnitManager = new TextureUnitManager(this)

  drawTarget: CanvasDrawTarget

  private shaderPrograms = new WeakMap<Shader, Program>()

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
      Object.assign(glOpts, opts)
    }

    const gl = this.gl = canvas.getContext("webgl", glOpts)! as WebGLRenderingContext

    this.halfFloatExt = gl.getExtension("OES_texture_half_float")
    this.vertexArrayExt = gl.getExtension('OES_vertex_array_object')
    this.capabilities = {
      halfFloat: !!this.halfFloatExt,
      halfFloatLinearFilter:  !!gl.getExtension("OES_texture_half_float_linear"),
      float: !!gl.getExtension("OES_texture_float"),
      floatLinearFilter: !!gl.getExtension("OES_texture_float_linear"),
    }

    this.drawTarget = new CanvasDrawTarget(this)
  }

  getOrCreateProgram(shader: Shader) {
    let program = this.shaderPrograms.get(shader)
    if (program) {
      return program
    } else {
      program = new Program(this, shader)
      this.shaderPrograms.set(shader, program)
      return program
    }
  }
}

export
class TextureUnitManager {
  lastCount = 0

  constructor(public context: Context) {
  }

  setTextures(textures: Texture[]) {
    const {gl} = this.context
    const count = Math.max(textures.length, this.lastCount)
    for (let i = 0; i < count; ++i) {
      gl.activeTexture(gl.TEXTURE0 + i)
      if (i < textures.length) {
        gl.bindTexture(gl.TEXTURE_2D, textures[i].texture)
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null)
      }
    }
    this.lastCount = textures.length
  }
}
