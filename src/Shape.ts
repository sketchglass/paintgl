import {Vec2, Rect} from "paintvec"
import {Context} from './Context'
import {ObjectMap} from "./ObjectMap"

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
class ShapeBase {
  readonly vertexBuffer: WebGLBuffer
  readonly indexBuffer: WebGLBuffer
  usage: ShapeUsage = "dynamic"
  indices: number[] = []
  attributes: ObjectMap<{size: number, data: number[]|Vec2[]}> = {}
  needsUpdate = true

  attributeStride() {
    let stride = 0
    for (const name in this.attributes) {
      stride += this.attributes[name].size
    }
    return stride
  }

  constructor(public context: Context) {
    const {gl} = context
    this.vertexBuffer = gl.createBuffer()!
    this.indexBuffer = gl.createBuffer()!
  }

  setFloatAttributes(name: string, attributes: number[]) {
    this.attributes[name] = {size: 1, data: attributes}
  }
  setVec2Attributes(name: string, attributes: Vec2[]) {
    this.attributes[name] = {size: 2, data: attributes}
  }

  update() {
    const {gl} = this.context
    const length = this.attributes[0].data.length
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
  }

  updateIfNeeded() {
    if (this.needsUpdate) {
      this.update()
      this.needsUpdate = false
    }
  }

  dispose() {
    const {gl} = this.context
    gl.deleteBuffer(this.vertexBuffer)
    gl.deleteBuffer(this.indexBuffer)
  }
}

export
class Shape extends ShapeBase {
  private _positions: Vec2[]
  private _texCoords: Vec2[]

  get positions() {
    return this._positions
  }
  set positions(positions: Vec2[]) {
    this._positions = positions
    this.needsUpdate = true
  }
  get texCoords() {
    return this._texCoords
  }
  set texCoords(texCoords: Vec2[]) {
    this._texCoords = texCoords
    this.needsUpdate = true
  }

  update() {
    const {length} = this.positions
    this.setVec2Attributes("aPosition", this.positions)
    this.setVec2Attributes("aTexCoord", this.texCoords)
    super.update()
  }
}

export
class QuadShape extends Shape {
  positions: [Vec2, Vec2, Vec2, Vec2] = [new Vec2(0, 0), new Vec2(0, 1), new Vec2(1, 0), new Vec2(1, 1)]
  texCoords: [Vec2, Vec2, Vec2, Vec2] = [new Vec2(0, 0), new Vec2(0, 1), new Vec2(1, 0), new Vec2(1, 1)]
  indices = [0, 1, 2, 1, 2, 3]
}

export
class RectShape extends QuadShape {
  private _rect = new Rect()

  get rect() {
    return this._rect
  }
  set rect(rect: Rect) {
    this._rect = rect
    this.needsUpdate = true
  }

  update() {
    const {rect} = this
    this.positions = [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight]
    super.update()
  }
}
