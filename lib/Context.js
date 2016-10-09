"use strict";
class Context {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this._fills = new WeakMap();
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
    getOrCreateFill(klass) {
        let fill = this._fills.get(klass);
        if (fill) {
            return fill;
        }
        else {
            fill = new klass(this);
            this._fills.set(klass, fill);
            return fill;
        }
    }
}
exports.Context = Context;
