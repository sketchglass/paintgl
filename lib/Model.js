"use strict";
const paintvec_1 = require("paintvec");
class Model {
    constructor(context, shape, fill) {
        this.context = context;
        this.shape = shape;
        this.fill = fill;
        this.transform = new paintvec_1.Transform();
    }
    draw(transform) {
        const { gl } = this.context;
        const { shape, fill } = this;
        shape.updateIfNeeded();
        fill.transform = this.transform.merge(transform);
        gl.useProgram(fill.program);
        let texUnit = 0;
        for (const name in fill._pixmapValues) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, fill._pixmapValues[name].texture);
            fill.setUniformInt(name, texUnit);
            ++texUnit;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        const stride = shape.attributeStride();
        let offset = 0;
        for (const name in shape.attributes) {
            const attribute = shape.attributes[name];
            const pos = gl.getAttribLocation(fill.program, name);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}
exports.Model = Model;
