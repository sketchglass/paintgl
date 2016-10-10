import {Vec2, Rect, Transform} from "paintvec"
import {Context} from './Context'
import {ObjectMap} from "./ObjectMap"
import {Fill, UniformValue} from "./Fill"
import {Color} from "./Color"
import {Drawable} from "./Drawable"

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
  usage: ShapeUsage = "dynamic"

  /**
    The indices of each triangles of this Shape.
  */
  indices: number[] = []

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
    Then fill class of this Shape.
  */
  fill: typeof Fill

  /**
    The uniform values passed to the fill.
  */
  uniforms: ObjectMap<UniformValue> = {}

  /**
    The transform of this Shape.
  */
  transform = new Transform()

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
    const fill = this.context.getOrCreateFill(this.fill)

    this.updateIfNeeded()
    fill.setUniform("transform", this.transform.merge(transform))
    for (const uniform in this.uniforms) {
      fill.setUniform(uniform, this.uniforms[uniform])
    }

    gl.useProgram(fill.program)

    let texUnit = 0
    for (const name in fill._textureValues) {
      gl.activeTexture(gl.TEXTURE0 + texUnit)
      gl.bindTexture(gl.TEXTURE_2D, fill._textureValues[name].texture)
      fill.setUniformInt(name, texUnit)
      ++texUnit
    }

    // TODO: use vertex array object if possible
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    const stride = this.attributeStride()
    let offset = 0
    for (const name in this.attributes) {
      const attribute = this.attributes[name]
      const pos = gl.getAttribLocation(fill.program, name)!
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
class Shape extends ShapeBase {
  positions: Vec2[] = []
  texCoords: Vec2[] = []

  update() {
    const {length} = this.positions
    this.setVec2Attributes("aPosition", this.positions)
    this.setVec2Attributes("aTexCoord", this.texCoords)
    super.update()
  }
}

export
class QuadShape extends Shape {
  positions: [Vec2, Vec2, Vec2, Vec2] = [new Vec2(0, 0), new Vec2(1, 0), new Vec2(0, 1), new Vec2(1, 1)]
  texCoords: [Vec2, Vec2, Vec2, Vec2] = [new Vec2(0, 0), new Vec2(1, 0), new Vec2(0, 1), new Vec2(1, 1)]
  indices = [0, 1, 2, 1, 2, 3]
}

export
class RectShape extends QuadShape {
  rect = new Rect()

  update() {
    const {rect} = this
    this.positions = [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight]
    super.update()
  }
}
