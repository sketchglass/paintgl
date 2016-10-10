"use strict";
const paintvec_1 = require("paintvec");
function glUsage(gl, usage) {
    switch (usage) {
        case "static":
            return gl.STATIC_DRAW;
        case "stream":
            return gl.STREAM_DRAW;
        case "dynamic":
        default:
            return gl.DYNAMIC_DRAW;
    }
}
class ShapeBase {
    constructor(context) {
        this.context = context;
        this.usage = "dynamic";
        this.indices = [];
        this.attributes = {};
        this.needsUpdate = true;
        this.uniforms = {};
        this.transform = new paintvec_1.Transform();
        const { gl } = context;
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }
    attributeStride() {
        let stride = 0;
        for (const name in this.attributes) {
            stride += this.attributes[name].size;
        }
        return stride;
    }
    setFloatAttributes(name, attributes) {
        this.attributes[name] = { size: 1, data: attributes };
    }
    setVec2Attributes(name, attributes) {
        this.attributes[name] = { size: 2, data: attributes };
    }
    update() {
        const { gl } = this.context;
        const length = this.attributes[Object.keys(this.attributes)[0]].data.length;
        const stride = this.attributeStride();
        const vertexData = new Float32Array(length * stride);
        for (let i = 0; i < length; ++i) {
            let offset = 0;
            for (const name in this.attributes) {
                const attribute = this.attributes[name];
                if (attribute.size == 1) {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value;
                }
                else {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value.x;
                    vertexData[i * stride + offset + 1] = value.y;
                }
                offset += attribute.size;
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, glUsage(gl, this.usage));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), glUsage(gl, this.usage));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.needsUpdate = false;
    }
    updateIfNeeded() {
        if (this.needsUpdate) {
            this.update();
        }
    }
    draw(transform) {
        const { gl } = this.context;
        const fill = this.context.getOrCreateFill(this.fill);
        this.updateIfNeeded();
        fill.setUniform("transform", this.transform.merge(transform));
        for (const uniform in this.uniforms) {
            fill.setUniform(uniform, this.uniforms[uniform]);
        }
        gl.useProgram(fill.program);
        let texUnit = 0;
        for (const name in fill._textureValues) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, fill._textureValues[name].texture);
            fill.setUniformInt(name, texUnit);
            ++texUnit;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const stride = this.attributeStride();
        let offset = 0;
        for (const name in this.attributes) {
            const attribute = this.attributes[name];
            const pos = gl.getAttribLocation(fill.program, name);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    }
}
exports.ShapeBase = ShapeBase;
class Shape extends ShapeBase {
    constructor(...args) {
        super(...args);
        this.positions = [];
        this.texCoords = [];
    }
    update() {
        const { length } = this.positions;
        this.setVec2Attributes("aPosition", this.positions);
        this.setVec2Attributes("aTexCoord", this.texCoords);
        super.update();
    }
}
exports.Shape = Shape;
class QuadShape extends Shape {
    constructor(...args) {
        super(...args);
        this.positions = [new paintvec_1.Vec2(0, 0), new paintvec_1.Vec2(1, 0), new paintvec_1.Vec2(0, 1), new paintvec_1.Vec2(1, 1)];
        this.texCoords = [new paintvec_1.Vec2(0, 0), new paintvec_1.Vec2(1, 0), new paintvec_1.Vec2(0, 1), new paintvec_1.Vec2(1, 1)];
        this.indices = [0, 1, 2, 1, 2, 3];
    }
}
exports.QuadShape = QuadShape;
class RectShape extends QuadShape {
    constructor(...args) {
        super(...args);
        this.rect = new paintvec_1.Rect();
    }
    update() {
        const { rect } = this;
        this.positions = [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight];
        super.update();
    }
}
exports.RectShape = RectShape;
