"use strict";
const paintvec_1 = require("paintvec");
function glDataType(context, format) {
    switch (format) {
        case "byte":
        default:
            return context.gl.UNSIGNED_BYTE;
        case "half-float":
            return context.halfFloatExt.HALF_FLOAT_OES;
        case "float":
            return context.gl.FLOAT;
    }
}
class Texture {
    constructor(context, opts) {
        this.context = context;
        const { gl } = context;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.filter = (opts.filter != undefined) ? opts.filter : "nearest";
        this.format = (opts.format != undefined) ? opts.format : "byte";
        if (opts.image) {
            this.setImage(opts.image);
        }
        else {
            this.setData(opts.size || new paintvec_1.Vec2(0), opts.data);
        }
    }
    get size() {
        return this._size;
    }
    set size(size) {
        this.setData(this.size);
    }
    get filter() {
        return this._filter;
    }
    set filter(filter) {
        this._filter = filter;
        const { gl } = this.context;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        switch (filter) {
            case "nearest":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                break;
            case "mipmap-nearest":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
                break;
            case "bilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                break;
            case "mipmap-bilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                break;
            case "trilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                break;
        }
    }
    setData(size, data) {
        const { gl, halfFloatExt } = this.context;
        this._size = size;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, glDataType(this.context, this.format), data ? data : null);
    }
    setImage(image) {
        const { gl } = this.context;
        this._size = new paintvec_1.Vec2(image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, glDataType(this.context, this.format), image);
    }
    generateMipmap() {
        const { gl } = this.context;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    dispose() {
        const { gl } = this.context;
        gl.deleteTexture(this.texture);
    }
}
exports.Texture = Texture;
