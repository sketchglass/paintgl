"use strict";

const paintvec_1 = require("paintvec");
const Shader_1 = require("./Shader");
const Shape_1 = require("./Shape");
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
class ShapeModel {
    constructor(context, opts) {
        this.context = context;
        const { vertexArrayExt } = context;
        this.shape = opts.shape;
        this.program = context.getOrCreateProgram(opts.shader);
        this.uniforms = opts.uniforms || {};
        this.blendMode = opts.blendMode || "src-over";
        this.transform = opts.transform || new paintvec_1.Transform();
        this.mode = opts.mode || "polygon";
        this.vertexArray = vertexArrayExt.createVertexArrayOES();
        this._updateVertexArray();
    }
    _updateVertexArray() {
        const { gl, vertexArrayExt } = this.context;
        const { shape, program } = this;
        vertexArrayExt.bindVertexArrayOES(this.vertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        const stride = shape.attributeStride();
        let offset = 0;
        for (const name in shape.attributes) {
            const attribute = shape.attributes[name];
            const pos = gl.getAttribLocation(program.program, name);
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, attribute.size, gl.FLOAT, false, stride * 4, offset * 4);
            offset += attribute.size;
        }
        vertexArrayExt.bindVertexArrayOES(null);
    }
    draw(transform) {
        const { gl, vertexArrayExt } = this.context;
        const { shape, program } = this;
        if (this.blendMode == "src") {
            gl.disable(gl.BLEND);
        } else {
            gl.enable(gl.BLEND);
            const funcs = blendFuncs(gl, this.blendMode);
            gl.blendFunc(funcs[0], funcs[1]);
        }
        gl.useProgram(program.program);
        shape.updateIfNeeded();
        program.setUniform("transform", this.transform.merge(transform));
        for (const uniform in this.uniforms) {
            program.setUniform(uniform, this.uniforms[uniform]);
        }
        let texUnit = 0;
        const textures = [];
        for (const [name, texture] of program._textureValues) {
            textures.push(texture);
            program.setUniformInt(name, texUnit);
            ++texUnit;
        }
        this.context.textureUnitManager.setTextures(textures);
        vertexArrayExt.bindVertexArrayOES(this.vertexArray);
        if (this.mode == "polygon") {
            gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.POINTS, 0, shape.length);
        }
        vertexArrayExt.bindVertexArrayOES(null);
    }
    dispose() {
        const { vertexArrayExt } = this.context;
        vertexArrayExt.deleteVertexArrayOES(this.vertexArray);
    }
}
exports.ShapeModel = ShapeModel;
class TextureModel {
    constructor(context, opts) {
        this.context = context;
        this.shape = new Shape_1.RectShape(this.context);
        this.shapeModel = new ShapeModel(this.context, {
            shape: this.shape,
            shader: Shader_1.textureShader
        });
        this.texture = opts.texture;
    }
    get texture() {
        return this._texture;
    }
    set texture(texture) {
        this._texture = texture;
        const rect = new paintvec_1.Rect(new paintvec_1.Vec2(), texture.size);
        if (!this.shape.rect.equals(rect)) {
            this.shape.rect = rect;
        }
        this.shapeModel.uniforms = { texture };
    }
    draw(transform) {
        this.shapeModel.draw(transform);
    }
    dispose() {
        this.shapeModel.dispose();
        this.shape.dispose();
    }
}
exports.TextureModel = TextureModel;