import {Vec2, Rect, Transform} from "paintvec"
import {Context} from './Context'
import {ObjectMap} from "./utils"
import {Shader, UniformValue} from "./Shader"
import {Color} from "./Color"
import {Drawable} from "./Drawable"
import {Texture} from "./Texture"

export type ShapeUsage = "static" | "stream" | "dynamic"

/**
  BlendMode represents how drawn color and destination color are blended.
*/
export type BlendMode = "src" | "src-over" | "src-in" | "src-out" | "src-atop"
                      | "dst" | "dst-over" | "dst-in" | "dst-out" | "dst-atop"

function glUsage(gl: WebGLRenderingContext, usage: ShapeUsage) {
  switch (usage) {
    case "static":
      return gl.STATIC_DRAW
    case "stream":
      return gl.STREAM_DRAW
    case "dynamic":
    default:
      return gl.DYNAMIC_DRAW
  }
}

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
interface ShapeBaseOptions {
  usage?: ShapeUsage
  indices?: number[]
  shader?: typeof Shader
  uniforms?: ObjectMap<UniformValue>
  blendMode?: BlendMode
  transform?: Transform
}

/**
  The base class of Shape.
*/
export
class ShapeBase implements Drawable {
  /**
    The WebGL vertex buffer for this Shape.
  */
  readonly vertexBuffer: WebGLBuffer

  /**
    The WebGL index buffer for this Shape.
  */
  readonly indexBuffer: WebGLBuffer

  /**
    The usage hint of this Shape.
  */
  usage: ShapeUsage

  /**
    The indices of each triangles of this Shape.
  */
  indices: number[]

  /**
    The vertex attributes of this Shape.
  */
  attributes: ObjectMap<{size: number, data: number[]|Vec2[]}> = {}

  /**
    Whether the buffer of this Shape should be updated.
    Set it to true after this shape is changed.
  */
  needsUpdate = true

  /**
    The shader class of this Shape.
  */
  shader: typeof Shader

  /**
    The uniform values passed to the shader.
  */
  uniforms: ObjectMap<UniformValue>

  blendMode: BlendMode

  /**
    The transform of this Shape.
  */
  transform: Transform

  attributeStride() {
    let stride = 0
    for (const name in this.attributes) {
      stride += this.attributes[name].size
    }
    return stride
  }

  constructor(public context: Context, opts: ShapeBaseOptions) {
    const {gl} = context
    this.usage = opts.usage || "dynamic"
    this.indices = opts.indices || []
    this.shader = opts.shader || Shader
    this.uniforms = opts.uniforms || {}
    this.blendMode = opts.blendMode || "src-over"
    this.transform = opts.transform || new Transform()

    this.vertexBuffer = gl.createBuffer()!
    this.indexBuffer = gl.createBuffer()!
  }

  setFloatAttributes(name: string, attributes: number[]) {
    this.attributes[name] = {size: 1, data: attributes}
    this.needsUpdate = true
  }
  setVec2Attributes(name: string, attributes: Vec2[]) {
    this.attributes[name] = {size: 2, data: attributes}
    this.needsUpdate = true
  }

  update() {
    const {gl} = this.context
    const length = this.attributes[Object.keys(this.attributes)[0]].data.length
    const stride = this.attributeStride()
    const vertexData = new Float32Array(length * stride)

    for (let i = 0; i < length; ++i) {
      let offset = 0
      for (const name in this.attributes) {
        const attribute = this.attributes[name]
        if (attribute.size == 1) {
          const value = attribute.data[i] as number
          vertexData[i * stride + offset] = value
        } else {
          const value = attribute.data[i] as Vec2
          vertexData[i * stride + offset] = value.x
          vertexData[i * stride + offset + 1] = value.y
        }
        offset += attribute.size
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, glUsage(gl, this.usage))
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), glUsage(gl, this.usage))
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    this.needsUpdate = false
  }

  updateIfNeeded() {
    if (this.needsUpdate) {
      this.update()
    }
  }

  draw(transform: Transform) {
    const {gl} = this.context
    const shader = this.context.getOrCreateShader(this.shader)

    if (this.blendMode == "src") {
      gl.disable(gl.BLEND)
    } else {
      gl.enable(gl.BLEND)
      const funcs = blendFuncs(gl, this.blendMode)
      gl.blendFunc(funcs[0], funcs[1])
    }

    this.updateIfNeeded()
    shader.setUniform("transform", this.transform.merge(transform))
    for (const uniform in this.uniforms) {
      shader.setUniform(uniform, this.uniforms[uniform])
    }

    gl.useProgram(shader.program)

    let texUnit = 0
    const textures: Texture[] = []
    for (const name in shader._textureValues) {
      textures.push(shader._textureValues[name])
      shader.setUniformInt(name, texUnit)
      ++texUnit
    }
    this.context.textureUnitManager.setTextures(textures)

    // TODO: use vertex array object if possible
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    const stride = this.attributeStride()
    let offset = 0
    for (const name in this.attributes) {
      const attribute = this.attributes[name]
      const pos = gl.getAttribLocation(shader.program, name)!
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4)
      offset += attribute.size
    }

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
  }

  dispose() {
    const {gl} = this.context
    gl.deleteBuffer(this.vertexBuffer)
    gl.deleteBuffer(this.indexBuffer)
  }
}

export
interface ShapeOptions extends ShapeBaseOptions {
  positions?: Vec2[]
  texCoords?: Vec2[]
}

export
class Shape extends ShapeBase {
  private _positions: Vec2[]
  private _texCoords: Vec2[]

  constructor(context: Context, opts: ShapeOptions) {
    super(context, opts)
    this.positions = opts.positions || []
    this.texCoords = opts.texCoords || []
  }

  get positions() {
    return this._positions
  }
  set positions(positions: Vec2[]) {
    this.setVec2Attributes("aPosition", positions)
  }
  get texCoords() {
    return this._texCoords
  }
  set texCoords(texCoords: Vec2[]) {
    this.setVec2Attributes("aTexCoord", texCoords)
  }
}

export
type QuadPolygon = [Vec2, Vec2, Vec2, Vec2]

export
interface QuadShapeOptions extends ShapeBaseOptions {
  positions?: QuadPolygon
}

export
class QuadShape extends Shape {
  constructor(context: Context, opts: QuadShapeOptions) {
    super(context, opts)
    this.texCoords = new Rect(new Vec2(0), new Vec2(1)).vertices()
  }
  positions: QuadPolygon
  texCoords: QuadPolygon
  indices = [0, 1, 2, 1, 2, 3]
}

export
interface RectShapeOptions extends ShapeBaseOptions {
  rect?: Rect
}

export
class RectShape extends QuadShape {
  _rect: Rect

  constructor(context: Context, opts: RectShapeOptions) {
    super(context, opts)
    this.rect = opts.rect || new Rect()
  }

  get rect() {
    return this._rect
  }
  set rect(rect: Rect) {
    this._rect = rect
    this.positions = rect.vertices()
  }
}
