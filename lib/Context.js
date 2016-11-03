"use strict";
/**
  Context contains the WebGL context.
*/
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this.textureUnitManager = new TextureUnitManager(this);
        this._shaders = new WeakMap();
        const glOpts = {
            preserveDrawingBuffer: false,
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
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
            floatLinearFilter: !!gl.getExtension("OES_texture_float_linear"),
        };
    }
    getOrCreateShader(klass) {
        let shader = this._shaders.get(klass);
        if (shader) {
            return shader;
        }
        else {
            shader = new klass(this);
            this._shaders.set(klass, shader);
            return shader;
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
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
        this.lastCount = textures.length;
    }
}
exports.TextureUnitManager = TextureUnitManager;
