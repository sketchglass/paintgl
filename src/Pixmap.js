"use strict";
var paintvec_1 = require("paintvec");
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
var Pixmap = (function () {
    function Pixmap(context, params) {
        this.context = context;
        var gl = context.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.filter = (params.filter != undefined) ? params.filter : "nearest";
        this.format = (params.format != undefined) ? params.format : "byte";
        if (params.image) {
            this.setImage(params.image);
        }
        else {
            this.setData(params.size || new paintvec_1.Vec2(0), params.data);
        }
    }
    Object.defineProperty(Pixmap.prototype, "size", {
        get: function () {
            return this._size;
        },
        set: function (size) {
            this.setData(this.size);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Pixmap.prototype, "filter", {
        get: function () {
            return this._filter;
        },
        set: function (filter) {
            this._filter = filter;
            var gl = this.context.gl;
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
        },
        enumerable: true,
        configurable: true
    });
    Pixmap.prototype.setData = function (size, data) {
        var _a = this.context, gl = _a.gl, halfFloatExt = _a.halfFloatExt;
        this._size = size;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, glDataType(this.context, this.format), data ? data : null);
    };
    Pixmap.prototype.setImage = function (image) {
        var gl = this.context.gl;
        this._size = new paintvec_1.Vec2(image.width, image.height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, glDataType(this.context, this.format), image);
    };
    Pixmap.prototype.generateMipmap = function () {
        var gl = this.context.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    Pixmap.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteTexture(this.texture);
    };
    return Pixmap;
}());
exports.Pixmap = Pixmap;
