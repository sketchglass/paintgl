import {Transform} from "paintvec"
import {Context} from "./Context"
import {Shape} from "./Shape"
import {Fill} from "./Fill"

/**
  Model represents the combination of a Shape and a Fill.
*/
export
class Model {
  /**
    The transform that applies to this Model.
  */
  transform = new Transform()

  /**
    @param context The Context this Model belongs to.
    @param shape The shape of this Model.
    @param fill The fill of this Model.
  */
  constructor(public context: Context, public shape: Shape, public fill: Fill) {
  }

  draw(transform: Transform) {
    const {gl} = this.context
    const {shape, fill} = this

    shape.updateIfNeeded()
    fill.transform = this.transform.merge(transform)

    gl.useProgram(fill.program)

    let texUnit = 0
    for (const name in fill._pixmapValues) {
      gl.activeTexture(gl.TEXTURE0 + texUnit)
      gl.bindTexture(gl.TEXTURE_2D, fill._pixmapValues[name].texture)
      fill.setUniformInt(name, texUnit)
      ++texUnit
    }

    // TODO: use vertex array object if possible
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer)
    const stride = shape.attributeStride()
    let offset = 0
    for (const name in shape.attributes) {
      const attribute = shape.attributes[name]
      const pos = gl.getAttribLocation(fill.program, name)!
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4)
      offset += attribute.size
    }

    gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0)
  }
}
