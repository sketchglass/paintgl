"use strict";
var Context = (function () {
    function Context(canvas, opts) {
        this.canvas = canvas;
        var glOpts = {
            preserveDrawingBuffer: false,
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
        };
        if (opts) {
            for (var key in opts) {
                glOpts[key] = opts[key];
            }
        }
        var gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        this.capabilities.halfFloat = !!this.halfFloatExt;
        this.capabilities.halfFloatLinearFilter = !!gl.getExtension("OES_texture_half_float_linear");
        this.capabilities.float = !!gl.getExtension("OES_texture_float");
        this.capabilities.floatLinearFilter = !!gl.getExtension("OES_texture_float_linear");
    }
    return Context;
}());
exports.Context = Context;
