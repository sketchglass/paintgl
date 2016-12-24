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
/**
  The base class of Shape.
*/
class ShapeBase {
    constructor(context, opts = {}) {
        this.context = context;
        /**
          The vertex attributes of this Shape.
        */
        this.attributes = {};
        this.length = 0;
        /**
          Whether the vertex buffer of this Shape should be updated.
          Set it to true after this shape is changed.
        */
        this.needsVerticesUpdate = true;
        this.needsIndicesUpdate = true;
        const { gl } = context;
        this.usage = opts.usage || "dynamic";
        this.indices = opts.indices || [];
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }
    /**
      The indices of each triangles of this Shape.
    */
    get indices() {
        return this._indices;
    }
    set indices(indices) {
        this._indices = indices;
        this.needsIndicesUpdate = true;
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
        this.length = attributes.length;
        this.needsVerticesUpdate = true;
    }
    setVec2Attributes(name, attributes) {
        this.attributes[name] = { size: 2, data: attributes };
        this.length = attributes.length;
        this.needsVerticesUpdate = true;
    }
    updateIndices() {
        const { gl } = this.context;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), glUsage(gl, this.usage));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.needsIndicesUpdate = false;
    }
    updateVertices() {
        const { gl } = this.context;
        const { length } = this;
        const stride = this.attributeStride();
        const vertexData = new Float32Array(length * stride);
        let offset = 0;
        for (const name in this.attributes) {
            const attribute = this.attributes[name];
            if (attribute.size == 1) {
                for (let i = 0; i < length; ++i) {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value;
                }
            } else {
                for (let i = 0; i < length; ++i) {
                    const value = attribute.data[i];
                    vertexData[i * stride + offset] = value.x;
                    vertexData[i * stride + offset + 1] = value.y;
                }
            }
            offset += attribute.size;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, glUsage(gl, this.usage));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.needsVerticesUpdate = false;
    }
    updateIfNeeded() {
        if (this.needsVerticesUpdate) {
            this.updateVertices();
        }
        if (this.needsIndicesUpdate) {
            this.updateIndices();
        }
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    }
}
exports.ShapeBase = ShapeBase;
class Shape extends ShapeBase {
    constructor(context, opts = {}) {
        super(context, opts);
        this.positions = opts.positions || [];
        this.texCoords = opts.texCoords || [];
    }
    get positions() {
        return this._positions;
    }
    set positions(positions) {
        this._positions = positions;
        this.setVec2Attributes("paintgl_aPosition", positions);
    }
    get texCoords() {
        return this._texCoords;
    }
    set texCoords(texCoords) {
        this._texCoords = texCoords;
        this.setVec2Attributes("paintgl_aTexCoord", texCoords);
    }
}
exports.Shape = Shape;
class QuadShape extends Shape {
    constructor(context, opts = {}) {
        super(context, opts);
        this.indices = [0, 1, 2, 2, 3, 0];
        this.positions = [new paintvec_1.Vec2(), new paintvec_1.Vec2(), new paintvec_1.Vec2(), new paintvec_1.Vec2()];
        this.texCoords = new paintvec_1.Rect(new paintvec_1.Vec2(0), new paintvec_1.Vec2(1)).vertices();
    }
}
exports.QuadShape = QuadShape;
class RectShape extends QuadShape {
    constructor(context, opts = {}) {
        super(context, opts);
        this.rect = opts.rect || new paintvec_1.Rect();
    }
    get rect() {
        return this._rect;
    }
    set rect(rect) {
        this._rect = rect;
        this.positions = rect.vertices();
    }
}
exports.RectShape = RectShape;