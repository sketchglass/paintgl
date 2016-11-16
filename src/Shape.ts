import {Vec2, Rect, Transform} from "paintvec"
import {Context} from './Context'
import {ObjectMap} from "./utils"
import {Shader, UniformValue} from "./Shader"
import {Color} from "./Color"
import {Texture} from "./Texture"

export type ShapeUsage = "static" | "stream" | "dynamic"

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

export
interface ShapeBaseOptions {
  usage?: ShapeUsage
  indices?: number[]
}

/**
  The base class of Shape.
*/
export
class ShapeBase {
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

  attributeStride() {
    let stride = 0
    for (const name in this.attributes) {
      stride += this.attributes[name].size
    }
    return stride
  }

  constructor(public context: Context, opts: ShapeBaseOptions = {}) {
    const {gl} = context
    this.usage = opts.usage || "dynamic"
    this.indices = opts.indices || []

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

  constructor(context: Context, opts: ShapeOptions = {}) {
    super(context, opts)
    this.positions = opts.positions || []
    this.texCoords = opts.texCoords || []
  }

  get positions() {
    return this._positions
  }
  set positions(positions: Vec2[]) {
    this._positions = positions
    this.setVec2Attributes("aPosition", positions)
  }
  get texCoords() {
    return this._texCoords
  }
  set texCoords(texCoords: Vec2[]) {
    this._texCoords = texCoords
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
  constructor(context: Context, opts: QuadShapeOptions = {}) {
    super(context, opts)
    this.positions = [new Vec2(), new Vec2(), new Vec2(), new Vec2()]
    this.texCoords = new Rect(new Vec2(0), new Vec2(1)).vertices()
  }
  positions: QuadPolygon
  texCoords: QuadPolygon
  indices = [0, 1, 2, 2, 3, 0]
}

export
interface RectShapeOptions extends ShapeBaseOptions {
  rect?: Rect
}

export
class RectShape extends QuadShape {
  _rect: Rect

  constructor(context: Context, opts: RectShapeOptions = {}) {
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
