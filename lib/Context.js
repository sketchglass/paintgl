"use strict";
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
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
            for (const key in opts) {
                glOpts[key] = opts[key];
            }
        }
        const gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
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
