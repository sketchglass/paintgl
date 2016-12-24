"use strict";

const Program_1 = require("./Program");
/**
  Context contains the WebGL context.
*/
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this.textureUnitManager = new TextureUnitManager(this);
        this.shaderPrograms = new WeakMap();
        const glOpts = {
            preserveDrawingBuffer: false,
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: true
        };
        if (opts) {
            Object.assign(glOpts, opts);
        }
        const gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        this.vertexArrayExt = gl.getExtension('OES_vertex_array_object');
        this.capabilities = {
            halfFloat: !!this.halfFloatExt,
            halfFloatLinearFilter: !!gl.getExtension("OES_texture_half_float_linear"),
            float: !!gl.getExtension("OES_texture_float"),
            floatLinearFilter: !!gl.getExtension("OES_texture_float_linear")
        };
    }
    getOrCreateProgram(shader) {
        let program = this.shaderPrograms.get(shader);
        if (program) {
            return program;
        } else {
            program = new Program_1.Program(this, shader);
            this.shaderPrograms.set(shader, program);
            return program;
        }
    }
}
exports.Context = Context;
class TextureUnitManager {
    constructor(context) {
        this.context = context;
        this.lastCount = 0;
    }
    setTextures(textures) {
        const { gl } = this.context;
        const count = Math.max(textures.length, this.lastCount);
        for (let i = 0; i < count; ++i) {
            gl.activeTexture(gl.TEXTURE0 + i);
            if (i < textures.length) {
                gl.bindTexture(gl.TEXTURE_2D, textures[i].texture);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
        this.lastCount = textures.length;
    }
}
exports.TextureUnitManager = TextureUnitManager;