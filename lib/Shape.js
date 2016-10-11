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
function blendFuncs(gl, mode) {
    switch (mode) {
        case "src":
            return [gl.ONE, gl.ZERO];
        default:
        case "src-over":
            return [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
        case "src-in":
            return [gl.DST_ALPHA, gl.ZERO];
        case "src-out":
            return [gl.ONE_MINUS_DST_ALPHA, gl.ZERO];
        case "src-atop":
            return [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
        case "dst":
            return [gl.ZERO, gl.ONE];
        case "dst-over":
            return [gl.ONE_MINUS_DST_ALPHA, gl.ONE];
        case "dst-in":
            return [gl.ZERO, gl.SRC_ALPHA];
        case "dst-out":
            return [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
        case "dst-atop":
            return [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA];
    }
}
/**
  The base class of Shape.
*/
class ShapeBase {
    constructor(context) {
        this.context = context;
        /**
          The usage hint of this Shape.
        */
        this.usage = "dynamic";
        /**
          The indices of each triangles of this Shape.
        */
        this.indices = [];
        /**
          The vertex attributes of this Shape.
        */
        this.attributes = {};
        /**
          Whether the buffer of this Shape should be updated.
          Set it to true after this shape is changed.
        */
        this.needsUpdate = true;
        /**
          The uniform values passed to the shader.
        */
        this.uniforms = {};
        this.blendMode = "src-over";
        /**
          The transform of this Shape.
        */
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
        this.needsUpdate = true;
    }
    setVec2Attributes(name, attributes) {
        this.attributes[name] = { size: 2, data: attributes };
        this.needsUpdate = true;
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
        const shader = this.context.getOrCreateShader(this.shader);
        if (this.blendMode == "src") {
            gl.disable(gl.BLEND);
        }
        else {
            gl.enable(gl.BLEND);
            const funcs = blendFuncs(gl, this.blendMode);
            gl.blendFunc(funcs[0], funcs[1]);
        }
        this.updateIfNeeded();
        shader.setUniform("transform", this.transform.merge(transform));
        for (const uniform in this.uniforms) {
            shader.setUniform(uniform, this.uniforms[uniform]);
        }
        gl.useProgram(shader.program);
        let texUnit = 0;
        const textures = [];
        for (const name in shader._textureValues) {
            textures.push(shader._textureValues[name]);
            shader.setUniformInt(name, texUnit);
            ++texUnit;
        }
        this.context.textureUnitManager.setTextures(textures);
        // TODO: use vertex array object if possible
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const stride = this.attributeStride();
        let offset = 0;
        for (const name in this.attributes) {
            const attribute = this.attributes[name];
            const pos = gl.getAttribLocation(shader.program, name);
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
    constructor(context, positions, texCoords) {
        super(context);
        this._positions = [];
        this._texCoords = [];
        this.positions = positions;
        this.texCoords = texCoords;
    }
    get positions() {
        return this._positions;
    }
    set positions(positions) {
        this.setVec2Attributes("aPosition", positions);
    }
    get texCoords() {
        return this._texCoords;
    }
    set texCoords(texCoords) {
        this.setVec2Attributes("aTexCoord", texCoords);
    }
}
exports.Shape = Shape;
class QuadShape extends Shape {
    constructor(context, positions) {
        super(context, positions, new paintvec_1.Rect(new paintvec_1.Vec2(0), new paintvec_1.Vec2(1)).vertices());
        this.indices = [0, 1, 2, 1, 2, 3];
    }
}
exports.QuadShape = QuadShape;
class RectShape extends QuadShape {
    constructor(context, _rect) {
        super(context, _rect.vertices());
        this._rect = _rect;
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
