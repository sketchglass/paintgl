import {Vec2, Rect, Transform} from "paintvec"
import {Context} from './Context'
import {ObjectMap} from "./utils"
import {Shader, textureShader} from "./Shader"
import {Program, UniformValue} from "./Program"
import {Texture} from "./Texture"
import {Shape, RectShape} from "./Shape"

/**
  Model represents the element renderable in `DrawTarget`.
*/
export
interface Model {
  draw(transform: Transform): void
}

/**
  BlendMode represents how drawn color and destination color are blended.
*/
export type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop"
                      | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop"

function blendFuncs(gl: WebGLRenderingContext, mode: BlendMode) {
  switch (mode) {
    case "src":
      return [gl.ONE, gl.ZERO]
    default:
    case "src-over":
      return [gl.ONE, gl.ONE_MINUS_SRC_ALPHA]
    case "src-in":
      return [gl.DST_ALPHA, gl.ZERO]
    case "src-out":
      return [gl.ONE_MINUS_DST_ALPHA, gl.ZERO]
    case "src-atop":
      return [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
    case "dst":
      return [gl.ZERO, gl.ONE]
    case "dst-over":
      return [gl.ONE_MINUS_DST_ALPHA, gl.ONE]
    case "dst-in":
      return [gl.ZERO, gl.SRC_ALPHA]
    case "dst-out":
      return [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA]
    case "dst-atop":
      return [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA]
  }
}

export
interface ShapeModelOptions {
  shape: Shape
  shader: Shader
  uniforms?: ObjectMap<UniformValue>
  blendMode?: BlendMode
  transform?: Transform
  mode?: ShapeModelMode
}

export type ShapeModelMode = "polygon"|"points"

export
class ShapeModel implements Model {
  shape: Shape

  vertexArray: any

  /**
    The shader program of this Shape.
  */
  readonly program: Program

  /**
    The uniform values passed to the shader.
  */
  uniforms: ObjectMap<UniformValue>

  blendMode: BlendMode

  /**
    The transform of this Shape.
  */
  transform: Transform

  mode: ShapeModelMode

  constructor(public context: Context, opts: ShapeModelOptions) {
    const {vertexArrayExt} = context
    this.shape = opts.shape
    this.program = context.getOrCreateProgram(opts.shader)
    this.uniforms = opts.uniforms || {}
    this.blendMode = opts.blendMode || "src-over"
    this.transform = opts.transform || new Transform()
    this.mode = opts.mode || "polygon"

    this.vertexArray = vertexArrayExt.createVertexArrayOES()
    this._updateVertexArray()
  }

  private _updateVertexArray() {
    const {gl, vertexArrayExt} = this.context
    const {shape, program} = this

    vertexArrayExt.bindVertexArrayOES(this.vertexArray)

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer)
    const stride = shape.attributeStride()
    let offset = 0
    for (const name in shape.attributes) {
      const attribute = shape.attributes[name]
      const pos = gl.getAttribLocation(program.program, name)!
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4)
      offset += attribute.size
    }

    vertexArrayExt.bindVertexArrayOES(null)
  }

  draw(transform: Transform) {
    const {gl, vertexArrayExt} = this.context
    const {shape, program} = this

    if (this.blendMode == "src") {
      gl.disable(gl.BLEND)
    } else {
      gl.enable(gl.BLEND)
      const funcs = blendFuncs(gl, this.blendMode)
      gl.blendFunc(funcs[0], funcs[1])
    }

    gl.useProgram(program.program)

    shape.updateIfNeeded()
    program.setUniform("paintgl_transform", this.transform.merge(transform))
    for (const uniform in this.uniforms) {
      program.setUniform(uniform, this.uniforms[uniform])
    }

    let texUnit = 0
    const textures: Texture[] = []
    for (const [name, texture] of program._textureValues) {
      textures.push(texture)
      program.setUniformInt(name, texUnit)
      ++texUnit
    }
    this.context.textureUnitManager.setTextures(textures)

    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    if (this.mode == "polygon") {
      gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0)
    } else {
      gl.drawArrays(gl.POINTS, 0, shape.length)
    }
    vertexArrayExt.bindVertexArrayOES(null)
  }

  dispose() {
    const {vertexArrayExt} = this.context
    vertexArrayExt.deleteVertexArrayOES(this.vertexArray)
  }
}

export
interface TextureModelOptions {
  texture?: Texture
}

export
class TextureModel implements Model {
  shape = new RectShape(this.context)
  shapeModel = new ShapeModel(this.context, {
    shape: this.shape,
    shader: textureShader
  })
  _texture: Texture|undefined

  get texture() {
    return this._texture
  }
  set texture(texture: Texture|undefined) {
    this._texture = texture
    if (!texture) {
      return
    }
    const rect = new Rect(new Vec2(), texture.size)
    if (!this.shape.rect.equals(rect)) {
      this.shape.rect = rect
    }
    this.shapeModel.uniforms = {texture}
  }

  constructor(public context: Context, opts: TextureModelOptions = {}) {
    this.texture = opts.texture
  }

  draw(transform: Transform) {
    this.shapeModel.draw(transform)
  }

  dispose() {
    this.shapeModel.dispose()
    this.shape.dispose()
  }
}
