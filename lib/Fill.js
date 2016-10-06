"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var paintvec_1 = require("paintvec");
var Color_1 = require("./Color");
var FillBase = (function () {
    function FillBase(context) {
        this.context = context;
        this._uniformLocations = {};
        this._pixmapValues = {};
        var gl = context.gl;
        this.program = gl.createProgram();
        var klass = this.constructor;
        this._addShader(gl.VERTEX_SHADER, klass.vertexShader);
        this._addShader(gl.FRAGMENT_SHADER, klass.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error("Failed to link shader:\n" + gl.getProgramInfoLog(this.program));
        }
    }
    FillBase.prototype._addShader = function (type, source) {
        var gl = this.context.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Failed to compile shader:\n" + gl.getShaderInfoLog(shader));
        }
        gl.attachShader(this.program, shader);
    };
    FillBase.prototype._uniformLocation = function (name) {
        var gl = this.context.gl;
        if (!(name in this._uniformLocations)) {
            this._uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
        return this._uniformLocations[name];
    };
    FillBase.prototype.setUniformInt = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform1i(this._uniformLocation(name), value);
    };
    FillBase.prototype.setUniformFloat = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform1f(this._uniformLocation(name), value);
    };
    FillBase.prototype.setUniformVec2 = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform2fv(this._uniformLocation(name), new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformColor = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniform4fv(this._uniformLocation(name), new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformTransform = function (name, value) {
        var gl = this.context.gl;
        gl.useProgram(this.program);
        gl.uniformMatrix3fv(this._uniformLocation(name), false, new Float32Array(value.members()));
    };
    FillBase.prototype.setUniformPixmap = function (name, pixmap) {
        this._pixmapValues[name] = pixmap;
    };
    FillBase.prototype.dispose = function () {
        var gl = this.context.gl;
        gl.deleteProgram(this.program);
    };
    FillBase.vertexShader = "";
    FillBase.fragmentShader = "";
    return FillBase;
}());
exports.FillBase = FillBase;
var Fill = (function (_super) {
    __extends(Fill, _super);
    function Fill(context) {
        _super.call(this, context);
        this.transform = new paintvec_1.Transform();
    }
    Object.defineProperty(Fill.prototype, "transform", {
        get: function () {
            return this._transform;
        },
        set: function (transform) {
            if (!this._transform.equals(transform)) {
                this.setUniformTransform("uTransform", transform);
                this._transform = transform;
            }
        },
        enumerable: true,
        configurable: true
    });
    Fill.vertexShader = "\n    precision highp float;\n\n    uniform mat3 uTransform;\n    attribute vec2 aPosition;\n    attribute vec2 aTexCoord;\n    varying vec2 vPosition;\n    varying vec2 vTexCoord;\n\n    void main(void) {\n      vPosition = aPosition;\n      vTexCoord = aTexCoord;\n      vec3 pos = uTransform * vec3(aPosition, 1.0);\n      gl_Position = vec4(pos.xy / pos.z, 0.0, 1.0);\n    }\n  ";
    Fill.fragmentShader = "\n    precision mediump float;\n    void main(void) {\n      gl_FragColor = vec4(0.0);\n    }\n  ";
    return Fill;
}(FillBase));
exports.Fill = Fill;
var PixmapFill = (function (_super) {
    __extends(PixmapFill, _super);
    function PixmapFill() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(PixmapFill.prototype, "pixmap", {
        get: function () {
            return this._pixmap;
        },
        set: function (pixmap) {
            if (this._pixmap != pixmap) {
                if (pixmap) {
                    this.setUniformPixmap("uPixmap", pixmap);
                }
                this._pixmap = pixmap;
            }
        },
        enumerable: true,
        configurable: true
    });
    PixmapFill.vertexShader = "\n    precision mediump float;\n    varying highp vec2 vTexCoord;\n    uniform sampler2D uPixmap;\n    void main(void) {\n      gl_FragColor = texture2D(uPixmap, vTexCoord);\n    }\n  ";
    return PixmapFill;
}(Fill));
exports.PixmapFill = PixmapFill;
var ColorFill = (function (_super) {
    __extends(ColorFill, _super);
    function ColorFill(context) {
        _super.call(this, context);
        this.color = new Color_1.Color(0, 0, 0, 1);
    }
    Object.defineProperty(ColorFill.prototype, "color", {
        get: function () {
            return this._color;
        },
        set: function (color) {
            if (!this._color.equals(color)) {
                this.setUniformColor("uColor", color);
            }
        },
        enumerable: true,
        configurable: true
    });
    ColorFill.vertexShader = "\n    precision mediump float;\n    uniform vec4 uColor;\n    void main(void) {\n      gl_FragColor = uColor;\n    }\n  ";
    return ColorFill;
}(Fill));
exports.ColorFill = ColorFill;
