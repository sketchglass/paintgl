"use strict";

const paintvec_1 = require("paintvec");
function glType(context, pixelType) {
    switch (pixelType) {
        case "byte":
        default:
            return context.gl.UNSIGNED_BYTE;
        case "half-float":
            return context.halfFloatExt.HALF_FLOAT_OES;
        case "float":
            return context.gl.FLOAT;
    }
}
exports.glType = glType;
function glFormat(gl, format) {
    switch (format) {
        case "alpha":
            return gl.ALPHA;
        case "rgb":
            return gl.RGB;
        default:
        case "rgba":
            return gl.RGBA;
    }
}
exports.glFormat = glFormat;
/**
  The Texture represents the image data on the GPU.
*/
class Texture {
    constructor(context, opts) {
        this.context = context;
        const { gl } = context;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.filter = opts.filter != undefined ? opts.filter : "nearest";
        this.pixelType = opts.pixelType != undefined ? opts.pixelType : "byte";
        this.pixelFormat = opts.pixelFormat != undefined ? opts.pixelFormat : "rgba";
        if (opts.image) {
            this.setImage(opts.image);
        } else {
            this.setData(opts.size || new paintvec_1.Vec2(0), opts.data);
        }
    }
    /**
      The size of this Texture.
    */
    get size() {
        return this._size;
    }
    set size(size) {
        this.setData(size);
    }
    /**
      The filter used in scaling of this Texture.
    */
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
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                break;
            case "trilinear":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                break;
        }
    }
    setData(size, data) {
        const { gl } = this.context;
        this._size = size;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const format = glFormat(gl, this.pixelFormat);
        const type = glType(this.context, this.pixelType);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, size.x, size.y, 0, format, type, data ? data : null);
    }
    setImage(image) {
        const { gl } = this.context;
        this._size = new paintvec_1.Vec2(image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const format = glFormat(gl, this.pixelFormat);
        const type = glType(this.context, this.pixelType);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, image);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
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