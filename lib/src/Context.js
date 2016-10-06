"use strict";
var Context = (function () {
    function Context(canvas) {
        this.canvas = canvas;
        var glOpts = {
            preserveDrawingBuffer: true,
            alpha: false,
            depth: false,
            stencil: false,
            antialias: true,
            premultipliedAlpha: true,
        };
        var gl = this.gl = canvas.getContext("webgl", glOpts);
        this.halfFloatExt = gl.getExtension("OES_texture_half_float");
        gl.getExtension("OES_texture_half_float_linear");
        gl.getExtension("OES_texture_float");
    }
    return Context;
}());
exports.Context = Context;
