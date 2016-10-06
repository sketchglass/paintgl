"use strict";
var paintvec_1 = require("paintvec");
var Model = (function () {
    function Model(context, shape, fill) {
        this.context = context;
        this.shape = shape;
        this.fill = fill;
        this.transform = new paintvec_1.Transform();
    }
    Model.prototype.draw = function (transform) {
        var gl = this.context.gl;
        var _a = this, shape = _a.shape, fill = _a.fill;
        shape.updateIfNeeded();
        fill.transform = this.transform.merge(transform);
        gl.useProgram(fill.program);
        var texUnit = 0;
        for (var name_1 in fill._pixmapValues) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, fill._pixmapValues[name_1].texture);
            fill.setUniformInt(name_1, texUnit);
            ++texUnit;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        var stride = shape.attributeStride();
        var offset = 0;
        for (var name_2 in shape.attributes) {
            var attribute = shape.attributes[name_2];
            var pos = gl.getAttribLocation(fill.program, name_2);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    return Model;
}());
exports.Model = Model;
